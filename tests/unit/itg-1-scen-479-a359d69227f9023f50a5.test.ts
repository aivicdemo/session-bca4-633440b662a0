import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-479: 正常系 - 有効なリーダーメールアドレスに対して提出通知メールが送信される', () => {
  it('有効なリーダーメールアドレスに対して提出通知メールが送信され、送信履歴が記録される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
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

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).toBeTruthy();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
