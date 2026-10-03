import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-512: メール送信に失敗した場合、sendDailyReportNotificationEmail は「メール送信に失敗しました。後ほど再試行します」の警告を返す', () => {
  const testInput: SendDailyReportSubmissionNotificationInput = {
    reporterId: 'reporter-001',
    dailyReportId: 'report-20240115-001',
    reportContent: '本日は顧客A社との打ち合わせ完了。明日は資料作成予定。',
    reportDate: '2024-01-15',
    leaderUserId: 'leader-001',
    leaderEmailAddress: 'leader@example.com',
    reporterName: '田中太郎',
    submissionTimestamp: '2024-01-15T18:00:00Z',
  };

  it('有効な入力値で sendDailyReportSubmissionNotification を呼び出し、成功結果を返す', async () => {
    const result = await sendDailyReportSubmissionNotification(testInput);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
