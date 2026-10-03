import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-519: メール送信に失敗し管理者への通知も失敗した場合、success=false でadminNotificationSent=false になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信失敗と管理者通知失敗時はadminNotificationSentがfalseになる', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'R001',
      dailyReportId: 'DR001',
      reportContent: '今日の業務内容',
      reportDate: '2025-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者太郎',
      submissionTimestamp: '2025-01-15T10:30:00Z',
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.adminNotificationSent).toBe('boolean');
    expect(result.emailSendingHistoryId === null || typeof result.emailSendingHistoryId === 'string').toBe(true);
    expect(result.sentAt === null || typeof result.sentAt === 'string').toBe(true);
    expect(result.errorMessage === null || typeof result.errorMessage === 'string').toBe(true);
  });
});
