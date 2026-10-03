import { sendDailyReportSubmissionNotification, DailyReportContentInvalidError } from '../../src/logic/email-notification-management';

describe('SCEN-502: 報告内容が空文字列の場合のエラー', () => {
  it('reportContent が空文字列の場合、DailyReportContentInvalidError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      DailyReportContentInvalidError
    );
  });
});
