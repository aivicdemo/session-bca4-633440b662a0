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
  ArchiveFailureError,
} from '../../src/logic/reporter-master-management';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';
import { archivePastDailyReports } from '../../src/logic/daily-report-persistence';

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.Mock;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.Mock;

describe('SCEN-384: 過去日報のアーカイブ処理に失敗した場合、エラーで拒否される', () => {
  const reporterId = 'reporter-123';
  const teamLeaderId = 'leader-456';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedIsReporterActiveAndValid.mockResolvedValue(true);
    mockedRecordReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'history-001',
    });
    mockedDeactivateReporterInMaster.mockResolvedValue({ success: true });
    mockedArchivePastDailyReports.mockRejectedValue(
      new ArchiveFailureError('過去日報のアーカイブに失敗しました。')
    );
  });

  it('ArchiveFailureError がスローされ、トランザクション全体がロールバック', async () => {
    await expect(
      deactivateReporter({
        reporterId,
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      })
    ).rejects.toThrow(ArchiveFailureError);

    expect(mockedIsReporterActiveAndValid).toHaveBeenCalledWith({
      reporterId,
      targetDate: executionTimestamp,
    });

    expect(mockedArchivePastDailyReports).toHaveBeenCalledWith({
      reporterId,
    });

    expect(mockedDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockedRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
