import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  DeactivateReporterOutput,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-380: チームリーダーが有効な報告者を無効化し、過去日報をアーカイブして変更履歴を記録する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deactivate reporter and archive past daily reports successfully', async () => {
    (dailyReportPersistence.archivePastDailyReports as jest.Mock).mockReturnValue({
      archivedCount: 5,
      archiveLocation: 'archive_table',
      activeReporterListUpdated: true,
    });
    (userMasterPersistence.deactivateReporterInMaster as jest.Mock).mockReturnValue(true);
    (userMasterPersistence.persistReporterMasterChangeHistory as jest.Mock).mockReturnValue('CHG20240115001');

    const input: DeactivateReporterInput = {
      reporterId: 'RPT002',
      teamLeaderId: 'TL001',
      deactivationReason: '異動',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const result = await deactivateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT002');
    expect(result.archivedReportCount).toBe(5);
    expect(result.message).toBe('報告者RPT002を無効化し、5件の過去日報をアーカイブしました。');
    expect(result.changeHistoryId).toBe('CHG20240115001');

    expect(dailyReportPersistence.archivePastDailyReports).toHaveBeenCalledWith('RPT002');
    expect(userMasterPersistence.deactivateReporterInMaster).toHaveBeenCalledWith('RPT002', new Date('2024-01-15T09:00:00Z'));
    const historyCall = (userMasterPersistence.persistReporterMasterChangeHistory as jest.Mock).mock.calls[0][0] as any;
    expect(historyCall.reporterId).toBe('RPT002');
    expect(historyCall.teamLeaderId).toBe('TL001');
    expect(historyCall.deactivationReason).toBe('異動');
  });
});
