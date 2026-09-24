jest.mock('../../src/logic/reporter-master-management', () => ({
  isReporterActiveAndValid: jest.fn(),
  recordReporterMasterChangeHistory: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  deactivateReporterInMaster: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  archivePastDailyReports: jest.fn(),
}));

import {
  isReporterActiveAndValid,
  recordReporterMasterChangeHistory,
  deactivateReporter,
  MasterUpdateFailureError,
} from '../../src/logic/reporter-master-management';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';
import { archivePastDailyReports } from '../../src/logic/daily-report-persistence';

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.Mock;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.Mock;

describe('SCEN-385: 報告者マスタの無効化更新に失敗した場合、エラーで拒否される', () => {
  const reporterId = 'RPT001';
  const teamLeaderId = 'TL001';
  const deactivationReason = '退職';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedIsReporterActiveAndValid.mockResolvedValue(true);
    mockedArchivePastDailyReports.mockResolvedValue({
      archivedReportCount: 5,
    });
    mockedDeactivateReporterInMaster.mockRejectedValue(
      new MasterUpdateFailureError('報告者マスタの更新に失敗しました。')
    );
  });

  it('MasterUpdateFailureError がスローされ、変更履歴は記録されない', async () => {
    await expect(
      deactivateReporter({
        reporterId,
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      })
    ).rejects.toThrow(MasterUpdateFailureError);

    expect(mockedIsReporterActiveAndValid).toHaveBeenCalled();
    expect(mockedArchivePastDailyReports).toHaveBeenCalled();
    expect(mockedDeactivateReporterInMaster).toHaveBeenCalled();
    expect(mockedRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
