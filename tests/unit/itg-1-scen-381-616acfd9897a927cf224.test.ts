import { deactivateReporter, ReporterNotFoundError } from '../../src/logic/reporter-master-management';
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

describe('SCEN-381: 指定された報告者が存在しないか既に無効化されている場合、エラーで拒否される', () => {
  const mockArchivePastDailyReports = dailyReportPersistence.archivePastDailyReports as jest.MockedFunction<typeof dailyReportPersistence.archivePastDailyReports>;
  const mockDeactivateReporterInMaster = userMasterPersistence.deactivateReporterInMaster as jest.MockedFunction<typeof userMasterPersistence.deactivateReporterInMaster>;
  const mockPersistReporterMasterChangeHistory = userMasterPersistence.persistReporterMasterChangeHistory as jest.MockedFunction<typeof userMasterPersistence.persistReporterMasterChangeHistory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された報告者が存在しないか既に無効化されている場合、ReporterNotFoundErrorが発生', async () => {
    const input = {
      reporterId: 'RPT-999',
      teamLeaderId: 'TL-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    const result = await deactivateReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toContain('報告者が見つかりません。');
    expect(result.changeHistoryId).toBe(null);

    expect(mockArchivePastDailyReports).not.toHaveBeenCalled();
    expect(mockDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
