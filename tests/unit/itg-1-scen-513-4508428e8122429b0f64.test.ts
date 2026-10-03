import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-513: 報告者ID・報告内容・送信日時・リーダーメールアドレス・報告者名がすべて有効な場合、sendDailyReportNotificationEmail はメール送信を成功させる', () => {
  const testInput: SendDailyReportSubmissionNotificationInput = {
    reporterId: 'reporter_001',
    dailyReportId: 'report_20250115_001',
    reportContent: '顧客A社との打ち合わせ完了、見積書作成開始',
    reportDate: '2025-01-15',
    leaderUserId: 'leader_001',
    leaderEmailAddress: 'leader@example.com',
    reporterName: '山田太郎',
    submissionTimestamp: '2025-01-15T09:30:00Z',
  };

  it('すべての入力が有効な場合、メール送信が成功する', async () => {
    const result = await sendDailyReportSubmissionNotification(testInput);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
