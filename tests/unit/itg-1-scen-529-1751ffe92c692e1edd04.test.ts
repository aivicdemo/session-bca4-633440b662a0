import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-529: reportDate が ISO 8601形式でない場合、処理の動作を確認する', () => {
  it('should return failure status when reportDate is invalid format', async () => {
    const input = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024-13-45',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBeTruthy();
    expect(result.adminNotificationSent).toBe(false);
  });
});
