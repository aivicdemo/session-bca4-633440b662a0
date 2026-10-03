import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-517: メール送信に成功した場合、success=true でメール送信履歴IDと送信日時が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常なメール送信で履歴IDと送信日時が返される', async () => {
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

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(typeof result.emailSendingHistoryId).toBe('string');
    expect(result.sentAt).not.toBeNull();
    expect(typeof result.sentAt).toBe('string');
    const sentAtDate = new Date(result.sentAt as string);
    const submissionDate = new Date(input.submissionTimestamp);
    expect(sentAtDate.getTime()).toBeGreaterThanOrEqual(submissionDate.getTime());
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
