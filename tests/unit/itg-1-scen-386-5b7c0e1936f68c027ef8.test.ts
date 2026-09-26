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

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.MockedFunction<any>;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.MockedFunction<any>;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.MockedFunction<any>;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.MockedFunction<any>;

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

  it('success=true、reporterId=RPT-001、archivedReportCount=0 を返す', async () => {
    const result: DeactivateReporterOutput = await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.archivedReportCount).toBe(0);
  });

  it('message は「過去日報がないため、アーカイブ処理をスキップします」を返す', async () => {
    const result: DeactivateReporterOutput = await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(result.message).toBe('過去日報がないため、アーカイブ処理をスキップします');
  });

  it('changeHistoryId は null ではない', async () => {
    const result: DeactivateReporterOutput = await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(result.changeHistoryId).not.toBeNull();
    expect(result.changeHistoryId).toBe('CHG-xxxxx');
  });

  it('archivePastDailyReports は呼び出されるが、アーカイブテーブルへの書き込みは発生しない', async () => {
    await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(mockedArchivePastDailyReports).toHaveBeenCalled();
  });

  it('deactivateReporterInMaster と recordReporterMasterChangeHistory は正常に呼び出される', async () => {
    await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(mockedDeactivateReporterInMaster).toHaveBeenCalled();
    expect(mockedRecordReporterMasterChangeHistory).toHaveBeenCalled();
  });

  it('報告者マスタ上の対象者は無効化状態に更新され、以降の日報提出対象から除外される', async () => {
    await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(mockedIsReporterActiveAndValid).toHaveBeenCalledWith({
      reporterId,
      targetDate: executionTimestamp,
    });
    expect(mockedDeactivateReporterInMaster).toHaveBeenCalled();
  });
});
