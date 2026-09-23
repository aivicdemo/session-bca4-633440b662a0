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

describe('SCEN-386: 対象報告者が過去日報を1件も持たない場合、無効化して0件をアーカイブする', () => {
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
    mockArchivePastDailyReports.mockResolvedValue({ archivedReportCount: 0 });
    // @ts-ignore
    mockDeactivateReporterInMaster.mockResolvedValue({ success: true });
    // @ts-ignore
    mockRecordReporterMasterChangeHistory.mockResolvedValue({ changeHistoryId: 'CHG-xxxxx' });
  });

  it('過去日報が0件の場合、success=true、archivedReportCount=0、messageが対応する値を返す', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-001',
      teamLeaderId: 'LDR-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    const result = await deactivateReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.archivedReportCount).toBe(0);
    expect(result.message).toContain('過去日報がないため');
    expect(result.changeHistoryId).toBe('CHG-xxxxx');
    expect(result.changeHistoryId).not.toBeNull();

    expect(mockArchivePastDailyReports).toHaveBeenCalled();
    expect(mockDeactivateReporterInMaster).toHaveBeenCalled();
    expect(mockRecordReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
