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

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.MockedFunction<any>;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.MockedFunction<any>;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.MockedFunction<any>;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.MockedFunction<any>;

describe('SCEN-384: 過去日報のアーカイブ処理に失敗した場合、エラーで拒否される', () => {
  const reporterId = 'reporter-123';
  const teamLeaderId = 'leader-456';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedIsReporterActiveAndValid.mockResolvedValue(true);
    mockedArchivePastDailyReports.mockRejectedValue(
      new ArchiveFailureError('過去日報のアーカイブに失敗しました。')
    );
  });

  it('ArchiveFailureError がスローされ、エラー文言「過去日報のアーカイブに失敗しました。」を含む', async () => {
    await expect(
      deactivateReporter({
        reporterId,
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      })
    ).rejects.toThrow(ArchiveFailureError);

    try {
      await deactivateReporter({
        reporterId,
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      });
    } catch (error) {
      expect((error as Error).message).toBe('過去日報のアーカイブに失敗しました。');
    }
  });

  it('DeactivateReporterOutput は返されず、出力型は返されない', async () => {
    await expect(
      deactivateReporter({
        reporterId,
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      })
    ).rejects.toThrow(ArchiveFailureError);
  });

  it('トランザクション全体がロールバック: deactivateReporterInMaster、recordReporterMasterChangeHistory は実行されない', async () => {
    try {
      await deactivateReporter({
        reporterId,
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      });
    } catch (error) {
      // エラーが予期される
    }

    expect(mockedDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockedRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('reporterId の無効化状態は変わらない（既にアーカイブされたのを除く）', async () => {
    try {
      await deactivateReporter({
        reporterId,
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      });
    } catch (error) {
      // エラーが予期される
    }

    expect(mockedIsReporterActiveAndValid).toHaveBeenCalled();
    expect(mockedArchivePastDailyReports).toHaveBeenCalled();
    expect(mockedDeactivateReporterInMaster).not.toHaveBeenCalled();
  });
});
