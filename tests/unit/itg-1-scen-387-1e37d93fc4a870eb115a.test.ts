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

describe('SCEN-387: 対象報告者が複数の過去日報を持つ場合、すべてアーカイブされ件数が返される', () => {
  const reporterId = 'reporter-001';
  const teamLeaderId = 'leader-001';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedIsReporterActiveAndValid.mockResolvedValue(true);
    mockedArchivePastDailyReports.mockResolvedValue({
      archivedReportCount: 5,
    });
    mockedDeactivateReporterInMaster.mockResolvedValue({ success: true });
    mockedRecordReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'history-001',
    });
  });

  it('success=true、archivedReportCount=5、callOrder: isReporterActiveAndValid → archivePastDailyReports → deactivateReporterInMaster → recordReporterMasterChangeHistory', async () => {
    const callOrder: string[] = [];

    mockedIsReporterActiveAndValid.mockImplementation(() => {
      callOrder.push('isReporterActiveAndValid');
      return Promise.resolve(true);
    });
    mockedArchivePastDailyReports.mockImplementation(() => {
      callOrder.push('archivePastDailyReports');
      return Promise.resolve({ archivedReportCount: 5 });
    });
    mockedDeactivateReporterInMaster.mockImplementation(() => {
      callOrder.push('deactivateReporterInMaster');
      return Promise.resolve({ success: true });
    });
    mockedRecordReporterMasterChangeHistory.mockImplementation(() => {
      callOrder.push('recordReporterMasterChangeHistory');
      return Promise.resolve({ changeHistoryId: 'history-001' });
    });

    const result: DeactivateReporterOutput = await deactivateReporter({
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.archivedReportCount).toBe(5);
    expect(result.changeHistoryId).toBe('history-001');

    expect(callOrder).toEqual([
      'isReporterActiveAndValid',
      'archivePastDailyReports',
      'deactivateReporterInMaster',
      'recordReporterMasterChangeHistory',
    ]);
  });
});
