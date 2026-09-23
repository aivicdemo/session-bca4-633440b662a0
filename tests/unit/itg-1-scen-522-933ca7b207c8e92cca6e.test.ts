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

describe('SCEN-522: 複数の入力値が同時に不正な場合、最初に検出されたエラーが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderEmailAddressInvalidError when multiple validations fail', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'invalid_reporter',
      dailyReportId: 'DR001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'invalid_email',
      reporterName: 'テスト太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockImplementation((email) => {
      if (email === 'invalid_email') {
        throw new LeaderEmailAddressInvalidError(
          'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。'
        );
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
