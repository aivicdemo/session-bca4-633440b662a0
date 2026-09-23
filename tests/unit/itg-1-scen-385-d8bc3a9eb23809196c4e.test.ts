import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import {
  archivePastDailyReports,
} from '../../src/logic/daily-report-persistence';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';
import { MasterUpdateFailureError } from '../../src/logic/reporter-master-management';

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

describe('SCEN-385: 報告者マスタの無効化更新に失敗した場合、エラーで拒否される', () => {
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
    mockDeactivateReporterInMaster.mockRejectedValue(
      // @ts-ignore
      new MasterUpdateFailureError('報告者マスタの更新に失敗しました。')
    );
  });

  it('deactivateReporterInMasterがMasterUpdateFailureErrorを発生させた場合、エラーが発生し、recordReporterMasterChangeHistoryは呼び出されない', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT001',
      teamLeaderId: 'TL001',
      deactivationReason: '退職',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    try {
      await deactivateReporter(input);
      fail('MasterUpdateFailureError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(MasterUpdateFailureError);
      expect((error as Error).message).toContain('報告者マスタの更新に失敗しました。');
    }

    expect(mockRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
