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

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

describe('SCEN-389: アーカイブテーブルへの書き込みに失敗した場合、エラーで拒否される', () => {
  const reporterId = 'reporter-001';
  const teamLeaderId = 'leader-001';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedIsReporterActiveAndValid.mockResolvedValue(true);
    mockedRecordReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'history-001',
      message: '変更履歴を記録しました。',
    });
    mockedArchivePastDailyReports.mockRejectedValue(
      new ArchiveFailureError('過去日報のアーカイブに失敗しました。')
    );
  });

  it('ArchiveFailureError がスローされ、エラー文言は「過去日報のアーカイブに失敗しました。」で、deactivateReporterInMaster と recordReporterMasterChangeHistory は呼び出されない', async () => {
    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    try {
      await deactivateReporter(input);
      fail('ArchiveFailureError should be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ArchiveFailureError);
      expect(err.message).toBe('過去日報のアーカイブに失敗しました。');
    }

    expect(mockedIsReporterActiveAndValid).toHaveBeenCalled();
    expect(mockedArchivePastDailyReports).toHaveBeenCalled();
    expect(mockedDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockedRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
