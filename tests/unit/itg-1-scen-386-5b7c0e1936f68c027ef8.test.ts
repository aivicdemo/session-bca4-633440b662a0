import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-386: 対象報告者が過去日報を1件も持たない場合、無効化して0件をアーカイブする', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deactivate reporter and return archivedReportCount=0 when no past reports exist', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-001',
      teamLeaderId: 'LDR-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    (dailyReportPersistence.archivePastDailyReports as jest.Mock<any>).mockResolvedValue({
      userId: 'RPT-001',
      archivedReportCount: 0,
      archivedAt: input.executionTimestamp.toISOString(),
    });
    (userMasterPersistence.deactivateReporterInMaster as jest.Mock<any>).mockResolvedValue({
      success: true,
      reporterId: 'RPT-001',
      message: 'Reporter deactivated',
    });

    const result = await deactivateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.archivedReportCount).toBe(0);
    expect(result.changeHistoryId).not.toBeNull();
    expect(result.message).toContain('スキップ');

    expect(dailyReportPersistence.archivePastDailyReports).toHaveBeenCalled();
    expect(userMasterPersistence.deactivateReporterInMaster).toHaveBeenCalled();
  });
});
