import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-517: メール送信に成功した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=true でメール送信履歴IDと送信日時が返される', async () => {
    // 入力値を構築
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客A社のシステム改修に従事。設計書作成完了。明日は実装予定。',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T18:30:00Z',
    };

    // sendDailyReportSubmissionNotification 関数を上記入力値で呼び出す
    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    // 返却された出力型 SendDailyReportSubmissionNotificationOutput を検証
    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(typeof result.emailSendingHistoryId).toBe('string');
    // UUID形式の検証
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result.emailSendingHistoryId as string)).toBe(true);
    expect(result.sentAt).not.toBeNull();
    expect(typeof result.sentAt).toBe('string');
    // ISO 8601形式の検証
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.sentAt as string)).toBe(true);
    // 送信日時が提出日時以降であることを確認
    const sentAtDate = new Date(result.sentAt as string);
    const submissionDate = new Date(input.submissionTimestamp);
    expect(sentAtDate.getTime()).toBeGreaterThanOrEqual(submissionDate.getTime());
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
