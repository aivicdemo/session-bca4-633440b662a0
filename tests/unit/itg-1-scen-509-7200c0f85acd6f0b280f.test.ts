import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-509: 有効なリーダーメールアドレスと報告内容が揃っている場合のメール送信成功', () => {
  it('全ての入力値が有効な場合、メール送信が成功する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20250115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施。成果物の仕様書初版を完成させた。課題は承認待ち。明日は顧客レビュー対応予定。',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2025-01-15T18:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
