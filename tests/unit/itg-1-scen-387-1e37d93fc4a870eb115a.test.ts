import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-387: 対象報告者が複数の過去日報を持つ場合、すべてアーカイブされ件数が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should archive all past reports and return archivedReportCount=5', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'reporter-001',
      teamLeaderId: 'leader-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    (dailyReportPersistence.archivePastDailyReports as jest.Mock<any>).mockResolvedValue({
      userId: 'reporter-001',
      archivedReportCount: 5,
      archivedAt: input.executionTimestamp.toISOString(),
    });
    (userMasterPersistence.deactivateReporterInMaster as jest.Mock<any>).mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'Reporter deactivated',
    });

    const result = await deactivateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.archivedReportCount).toBe(5);
    expect(result.changeHistoryId).not.toBeNull();

    expect(dailyReportPersistence.archivePastDailyReports).toHaveBeenCalled();
    expect(userMasterPersistence.deactivateReporterInMaster).toHaveBeenCalled();
  });
});
