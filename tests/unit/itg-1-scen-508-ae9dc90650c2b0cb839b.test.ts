import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-508: メール送信サービスが一時的に利用不可の場合', () => {
  it('有効なメールアドレスで呼び出された場合、成功を返す', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日の業務：システムテスト実施、成果：テスト仕様書作成完了、課題：なし、明日の予定：レビュー対応',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
