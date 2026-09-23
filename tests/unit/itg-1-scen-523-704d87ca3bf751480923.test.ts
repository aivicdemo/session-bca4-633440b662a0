import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-523: リーダーメールアドレスが空の場合、送信を中止してエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when leaderEmailAddress is empty string', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客対応とドキュメント作成を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T17:30:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockImplementation((email) => {
      if (email === '') {
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
