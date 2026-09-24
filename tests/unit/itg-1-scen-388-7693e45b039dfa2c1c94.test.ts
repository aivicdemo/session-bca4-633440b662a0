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
  deactivateReporter,
  MasterUpdateFailureError,
} from '../../src/logic/reporter-master-management';

describe('SCEN-388: 報告者IDが空または不正な形式の場合、エラーで拒否される', () => {
  const teamLeaderId = 'TL001';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  it('reporterId が空文字列の場合、MasterUpdateFailureError をスロー', async () => {
    await expect(
      deactivateReporter({
        reporterId: '',
        teamLeaderId,
        deactivationReason,
        executionTimestamp,
      })
    ).rejects.toThrow(MasterUpdateFailureError);
  });
});
