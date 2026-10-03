jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  archivePastDailyReports: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  deactivateReporterInMaster: jest.fn(),
}));

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  ArchiveFailureError,
} from '../../src/logic/reporter-master-management';
import * as userMasterPersistenceModule from '../../src/logic/user-master-persistence';
import * as dailyReportPersistenceModule from '../../src/logic/daily-report-persistence';

const mockedDeactivateReporterInMaster = userMasterPersistenceModule.deactivateReporterInMaster as jest.MockedFunction<typeof userMasterPersistenceModule.deactivateReporterInMaster>;
const mockedArchivePastDailyReports = dailyReportPersistenceModule.archivePastDailyReports as jest.MockedFunction<typeof dailyReportPersistenceModule.archivePastDailyReports>;

describe('SCEN-389: アーカイブテーブルへの書き込みに失敗した場合、エラーで拒否される', () => {
  const reporterId = 'reporter-001';
  const teamLeaderId = 'leader-001';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockedArchivePastDailyReports.mockRejectedValue(
      new ArchiveFailureError('過去日報のアーカイブに失敗しました。')
    );
  });

  it('ArchiveFailureError がスローされ、エラー文言は「過去日報のアーカイブに失敗しました。」で、deactivateReporterInMaster は呼び出されない', async () => {
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

    expect(mockedArchivePastDailyReports).toHaveBeenCalled();
    expect(mockedDeactivateReporterInMaster).not.toHaveBeenCalled();
  });
});
