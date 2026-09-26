import {
  sendDailyReportSubmissionNotification,
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput
} from '../../src/logic/email-notification-management';

describe('SCEN-490: リーダーメールアドレスがアクティブな場合、sendDailyReportSubmissionNotification は通知送信可能と判定する', () => {
  it('should send daily report submission notification when leader email is active', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Today I completed the project setup and started development.',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBeDefined();
    expect(result.sentAt).toBeDefined();
    expect(result.adminNotificationSent).toBe(false);
    expect(result.errorMessage).toBeNull();
  });
});
