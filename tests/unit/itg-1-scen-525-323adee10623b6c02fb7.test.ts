import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-525: 日報の入力内容が空文字列の場合、メール本文生成に失敗する', () => {
  it('should return failure status when reportContent is empty', async () => {
    const input = {
      reporterId: 'reporter001',
      dailyReportId: 'report-123',
      reportContent: '',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe(
      '日報の内容が不完全であるため、通知メールを生成できません。'
    );
    expect(result.adminNotificationSent).toBe(true);
  });
});
