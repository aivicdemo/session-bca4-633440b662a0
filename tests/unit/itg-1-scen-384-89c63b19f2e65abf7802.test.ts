import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  ArchiveFailureError,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-384: 過去日報のアーカイブ処理に失敗した場合、エラーで拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ArchiveFailureError when archivePastDailyReports fails', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'reporter-123',
      teamLeaderId: 'leader-456',
      deactivationReason: '異動',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    (dailyReportPersistence.archivePastDailyReports as jest.Mock<any>).mockRejectedValue(
      new ArchiveFailureError('過去日報のアーカイブに失敗しました。')
    );

    await expect(deactivateReporter(input)).rejects.toThrow(ArchiveFailureError);
    await expect(deactivateReporter(input)).rejects.toThrow('過去日報のアーカイブに失敗しました。');

    expect(dailyReportPersistence.archivePastDailyReports).toHaveBeenCalled();
    expect(userMasterPersistence.deactivateReporterInMaster).not.toHaveBeenCalled();
  });
});
