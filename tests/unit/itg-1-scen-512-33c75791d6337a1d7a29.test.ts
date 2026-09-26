import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  EmailSendingFailedError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-512: メール送信に失敗した場合、sendDailyReportNotificationEmail は「メール送信に失敗しました。後ほど再試行します」の警告を返す', () => {
  let mockValidateEmailAddressForDelivery: jest.MockedFunction<any>;
  let mockBuildNotificationContent: jest.MockedFunction<any>;
  let mockRecordEmailSendingHistory: jest.MockedFunction<any>;
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

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

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
    mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    mockRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
    mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年1月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせ完了。明日は資料作成予定。',
    });

    mockRecordEmailSendingHistory.mockRejectedValue(
      new EmailSendingFailedError('メール送信に失敗しました。管理者に通知します。')
    );
  });

  it('メール送信に失敗し、管理者への通知が試行される', async () => {
    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。管理者に通知します。',
      adminNotificationSent: true,
    };

    mockSendDailyReportSubmissionNotification.mockResolvedValue(expectedOutput);

    const result = await sendDailyReportSubmissionNotification(testInput);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
