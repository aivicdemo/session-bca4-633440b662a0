import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-528: メールアドレスのドメイン部分が無効な場合、形式検証に失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when email domain format is invalid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-2024-01-15',
      reportContent: '顧客A社の要件確認を実施し、基本設計書を作成した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com.',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockImplementation((email) => {
      if (email.endsWith('.')) {
        return Promise.resolve({ isValid: false });
      }
      return Promise.resolve({ isValid: true });
    });

    const mockBuildNotificationContent = jest.mocked(buildNotificationContent);
    const mockRecordEmailSendingHistory = jest.mocked(recordEmailSendingHistory);

    const result: SendDailyReportSubmissionNotificationOutput =
      await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBe(null);
    expect(result.sentAt).toBe(null);
    expect(result.errorMessage).toBe(
      'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。'
    );
    expect(result.adminNotificationSent).toBe(true);
    expect(mockBuildNotificationContent).not.toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
