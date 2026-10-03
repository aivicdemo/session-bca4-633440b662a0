import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-527: メールアドレスが @を含まない場合、形式検証に失敗する', () => {
  it('should return failure status when email lacks @ symbol', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115',
      reportContent: '本日は顧客A社のシステム要件ヒアリングを実施した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe(
      'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。'
    );
    expect(result.adminNotificationSent).toBe(true);
  });
});
