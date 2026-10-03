import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-490: リーダーメールアドレスがアクティブな場合、validateAndRouteLeaderNotification は通知送信可能と判定する', () => {
  it('アクティブなメールアドレスの場合、通知送信可能と判定される', async () => {
    const input = {
      reporterId: 'reporter001',
      dailyReportId: 'report-2024-01-15-001',
      reportContent: '本日は顧客A向けシステム設計を実施。要件定義書を完成させた。明日は実装開始予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBeTruthy();
    expect(result.sentAt).toBeTruthy();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
