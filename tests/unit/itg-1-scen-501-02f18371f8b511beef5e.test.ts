import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-501: 有効なリーダーメールアドレスに対してメール通知の全検証が成功する', () => {
  it('全ての前提条件が満たされた場合、メール送信が成功する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
