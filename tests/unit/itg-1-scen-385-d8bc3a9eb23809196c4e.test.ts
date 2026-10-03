import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  MasterUpdateFailureError,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-385: 報告者マスタの無効化更新に失敗した場合、エラーで拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MasterUpdateFailureError when deactivateReporterInMaster fails', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT001',
      teamLeaderId: 'TL001',
      deactivationReason: '退職',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    (dailyReportPersistence.archivePastDailyReports as jest.Mock<any>).mockResolvedValue({
      userId: 'RPT001',
      archivedReportCount: 5,
      archivedAt: '2024-01-15T10:00:00Z',
    });
    (userMasterPersistence.deactivateReporterInMaster as jest.Mock<any>).mockRejectedValue(
      new MasterUpdateFailureError('報告者マスタの更新に失敗しました。')
    );

    await expect(deactivateReporter(input)).rejects.toThrow(MasterUpdateFailureError);
    await expect(deactivateReporter(input)).rejects.toThrow('報告者マスタの更新に失敗しました。');

    expect(dailyReportPersistence.archivePastDailyReports).toHaveBeenCalled();
    expect(userMasterPersistence.deactivateReporterInMaster).toHaveBeenCalled();
  });
});
