import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-519: メール送信に失敗し管理者への通知も失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=false でadminNotificationSent=false になる', async () => {
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

    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);
    mockSend.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。管理者に通知します。',
      adminNotificationSent: false,
    } as SendDailyReportSubmissionNotificationOutput);

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(result.adminNotificationSent).toBe(false);
  });
});
