import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import {
  archivePastDailyReports,
} from '../../src/logic/daily-report-persistence';
import { ArchiveFailureError } from '../../src/logic/reporter-master-management';
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

describe('SCEN-389: アーカイブテーブルへの書き込みに失敗した場合、エラーで拒否される', () => {
  let mockIsReporterActiveAndValid: jest.Mock;
  let mockRecordReporterMasterChangeHistory: jest.Mock;
  let mockArchivePastDailyReports: jest.Mock;
  let mockDeactivateReporterInMaster: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsReporterActiveAndValid = require('../../src/logic/reporter-master-management.ts').isReporterActiveAndValid as jest.Mock;
    mockRecordReporterMasterChangeHistory = require('../../src/logic/reporter-master-management.ts').recordReporterMasterChangeHistory as jest.Mock;
    mockArchivePastDailyReports = require('../../src/logic/daily-report-persistence.ts').archivePastDailyReports as jest.Mock;
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;

    // @ts-ignore
    mockIsReporterActiveAndValid.mockResolvedValue(true);
    // @ts-ignore
    mockRecordReporterMasterChangeHistory.mockResolvedValue({ changeHistoryId: 'history-001' });
    // @ts-ignore
    mockArchivePastDailyReports.mockRejectedValue(
      // @ts-ignore
      new ArchiveFailureError('過去日報のアーカイブに失敗しました。')
    );
  });

  it('archivePastDailyReportsでArchiveFailureErrorが発生した場合、deactivateReporterInMasterは呼び出されない', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'reporter-001',
      teamLeaderId: 'leader-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
      fail('ArchiveFailureError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ArchiveFailureError);
      expect((error as Error).message).toContain('過去日報のアーカイブに失敗しました。');
    }

    expect(mockDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
