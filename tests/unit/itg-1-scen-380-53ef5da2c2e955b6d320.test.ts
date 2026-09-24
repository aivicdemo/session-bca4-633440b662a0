import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  DeactivateReporterOutput,
  isReporterActiveAndValid,
  recordReporterMasterChangeHistory,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-380: チームリーダーが有効な報告者を無効化し、過去日報をアーカイブして変更履歴を記録する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deactivate reporter and archive past daily reports successfully', () => {
    const mockIsReporterActive = jest.spyOn(
      require('../../src/logic/reporter-master-management'),
      'isReporterActiveAndValid' as any
    );
    mockIsReporterActive.mockReturnValue(true);

    const mockArchivePastReports = jest.spyOn(dailyReportPersistence, 'archivePastDailyReports' as any);
    mockArchivePastReports.mockReturnValue({
      archivedCount: 5,
      archiveLocation: 'archive_table',
      activeReporterListUpdated: true,
    });

    const mockDeactivateMaster = jest.spyOn(userMasterPersistence, 'deactivateReporterInMaster' as any);
    mockDeactivateMaster.mockReturnValue(true);

    const mockRecordHistory = jest.spyOn(
      require('../../src/logic/reporter-master-management'),
      'recordReporterMasterChangeHistory' as any
    );
    mockRecordHistory.mockReturnValue('CHG20240115001');

    const input: DeactivateReporterInput = {
      reporterId: 'RPT002',
      teamLeaderId: 'TL001',
      deactivationReason: '異動',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const result = deactivateReporter(input) as DeactivateReporterOutput;

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT002');
    expect(result.archivedReportCount).toBe(5);
    expect(result.message).toBe('報告者RPT002を無効化し、5件の過去日報をアーカイブしました。');
    expect(result.changeHistoryId).toBe('CHG20240115001');

    // verify that archive operation was called
    expect(mockArchivePastReports).toHaveBeenCalledWith('RPT002');

    // verify that deactivate operation was called
    expect(mockDeactivateMaster).toHaveBeenCalledWith(
      'RPT002',
      new Date('2024-01-15T09:00:00Z')
    );

    // verify that change history was recorded
    expect(mockRecordHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'RPT002',
        teamLeaderId: 'TL001',
        deactivationReason: '異動',
        executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      })
    );
  });
});
