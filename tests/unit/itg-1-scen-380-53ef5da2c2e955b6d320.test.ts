import { deactivateReporter } from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  archivePastDailyReports: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-380: チームリーダーが有効な報告者を無効化し、過去日報をアーカイブして変更履歴を記録する', () => {
  const mockArchivePastDailyReports = dailyReportPersistence.archivePastDailyReports as jest.MockedFunction<typeof dailyReportPersistence.archivePastDailyReports>;
  const mockDeactivateReporterInMaster = userMasterPersistence.deactivateReporterInMaster as jest.MockedFunction<typeof userMasterPersistence.deactivateReporterInMaster>;
  const mockPersistReporterMasterChangeHistory = userMasterPersistence.persistReporterMasterChangeHistory as jest.MockedFunction<typeof userMasterPersistence.persistReporterMasterChangeHistory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームリーダーが有効な報告者を無効化し、過去日報をアーカイブして変更履歴を記録する', async () => {
    mockArchivePastDailyReports.mockResolvedValue({
      userId: 'RPT002',
      archivedReportCount: 5,
      archivedAt: '2024-01-15T09:00:00Z',
    });
    mockDeactivateReporterInMaster.mockResolvedValue({
      success: true,
      reporterId: 'RPT002',
      message: 'Success'
    });
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'CHG20240115001',
      message: 'Success'
    });

    const input = {
      reporterId: 'RPT002',
      teamLeaderId: 'TL001',
      deactivationReason: '異動',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const result = await deactivateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT002');
    expect(result.archivedReportCount).toBe(5);
    expect(result.message).toContain('報告者RPT002を無効化し、5件の過去日報をアーカイブしました。');
    expect(result.changeHistoryId).toBe('CHG20240115001');

    expect(mockArchivePastDailyReports).toHaveBeenCalledWith({ userId: 'RPT002', archivedAt: expect.any(String) });
    expect(mockDeactivateReporterInMaster).toHaveBeenCalledWith({
      reporterId: 'RPT002',
      leaderUserId: 'TL001',
      deactivationTimestamp: new Date('2024-01-15T09:00:00Z'),
      deactivationReason: '異動'
    });
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'RPT002',
        executorId: 'TL001',
        executionTimestamp: new Date('2024-01-15T09:00:00Z'),
        deactivationReason: '異動'
      })
    );
  });
});
