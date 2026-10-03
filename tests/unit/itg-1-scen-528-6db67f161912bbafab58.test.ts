import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-528: メールアドレスのドメイン部分が空の場合、形式検証に失敗する', () => {
  it('should return failure status when domain has invalid format', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-2024-01-15',
      reportContent: '顧客A社の要件確認を実施し、基本設計書を作成した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com.',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
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
