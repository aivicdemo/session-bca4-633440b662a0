import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-527: メールアドレスが @を含まない場合、形式検証に失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when email address does not contain @', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115',
      reportContent: '本日は顧客A社のシステム要件ヒアリングを実施した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockImplementation((email) => {
      if (!email.includes('@')) {
        return Promise.resolve({ isValid: false });
      }
      return Promise.resolve({ isValid: true });
    });

    const result: SendDailyReportSubmissionNotificationOutput =
      await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBe(null);
    expect(result.sentAt).toBe(null);
    expect(result.errorMessage).toBe(
      'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。'
    );
    expect(result.adminNotificationSent).toBe(true);
  });
});
