import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  DeactivateReporterOutput,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import {
  archivePastDailyReports,
} from '../../src/logic/daily-report-persistence';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/reporter-master-management.ts', () => ({
  isReporterActiveAndValid: jest.fn(),
  recordReporterMasterChangeHistory: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence.ts', () => ({
  archivePastDailyReports: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-387: 対象報告者が複数の過去日報を持つ場合、すべてアーカイブされ件数が返される', () => {
  let mockIsReporterActiveAndValid: jest.Mock;
  let mockArchivePastDailyReports: jest.Mock;
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockRecordReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsReporterActiveAndValid = require('../../src/logic/reporter-master-management.ts').isReporterActiveAndValid as jest.Mock;
    mockArchivePastDailyReports = require('../../src/logic/daily-report-persistence.ts').archivePastDailyReports as jest.Mock;
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockRecordReporterMasterChangeHistory = require('../../src/logic/reporter-master-management.ts').recordReporterMasterChangeHistory as jest.Mock;

    // @ts-ignore
    mockIsReporterActiveAndValid.mockResolvedValue(true);
    // @ts-ignore
    mockArchivePastDailyReports.mockResolvedValue({ archivedReportCount: 5 });
    // @ts-ignore
    mockDeactivateReporterInMaster.mockResolvedValue({ success: true });
    // @ts-ignore
    mockRecordReporterMasterChangeHistory.mockResolvedValue({ changeHistoryId: 'history-001' });
  });

  it('複数の過去日報を持つ場合、すべてアーカイブされ、archivedReportCount=5を返す', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'reporter-001',
      teamLeaderId: 'leader-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    const result = await deactivateReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.archivedReportCount).toBe(5);
    expect(result.changeHistoryId).toBe('history-001');

    // 各スタブが呼び出されたことを検証
    expect(mockIsReporterActiveAndValid).toHaveBeenCalled();
    expect(mockArchivePastDailyReports).toHaveBeenCalled();
    expect(mockDeactivateReporterInMaster).toHaveBeenCalled();
    expect(mockRecordReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
