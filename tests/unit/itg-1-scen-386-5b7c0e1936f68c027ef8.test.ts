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

import {
  isReporterActiveAndValid,
  recordReporterMasterChangeHistory,
  deactivateReporter,
  DeactivateReporterOutput,
} from '../../src/logic/reporter-master-management';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';
import { archivePastDailyReports } from '../../src/logic/daily-report-persistence';

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.Mock;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.Mock;

describe('SCEN-386: 対象報告者が過去日報を1件も持たない場合、無効化して0件をアーカイブする', () => {
  const reporterId = 'RPT-001';
  const teamLeaderId = 'LDR-001';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedIsReporterActiveAndValid.mockResolvedValue(true);
    mockedArchivePastDailyReports.mockResolvedValue({
      archivedReportCount: 0,
    });
    mockedDeactivateReporterInMaster.mockResolvedValue({ success: true });
    mockedRecordReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'CHG-xxxxx',
    });
  });

  it('success=true、archivedReportCount=0、message は「過去日報がないため、アーカイブ処理をスキップします」を返す', async () => {
    const result: DeactivateReporterOutput = await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.archivedReportCount).toBe(0);
    expect(result.message).toBe('過去日報がないため、アーカイブ処理をスキップします');
    expect(result.changeHistoryId).toBe('CHG-xxxxx');

    expect(mockedIsReporterActiveAndValid).toHaveBeenCalledWith({
      reporterId,
      targetDate: executionTimestamp,
    });
    expect(mockedArchivePastDailyReports).toHaveBeenCalledWith({ reporterId });
    expect(mockedDeactivateReporterInMaster).toHaveBeenCalled();
    expect(mockedRecordReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
