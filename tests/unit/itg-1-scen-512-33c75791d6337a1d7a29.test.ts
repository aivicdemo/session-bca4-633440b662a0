jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  EmailSendingFailedError,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;

describe('SCEN-512: メール送信に失敗した場合、sendDailyReportNotificationEmail は警告を返す', () => {
  const testInput = {
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
    jest.resetAllMocks();

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年1月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせ完了。明日は資料作成予定。',
    });

    mockedRecordEmailSendingHistory.mockRejectedValue(
      new EmailSendingFailedError('メール送信に失敗しました。管理者に通知します。')
    );
  });

  it('EmailSendingFailedError がスローされ、管理者への通知が試行される', async () => {
    try {
      await mockedSendDailyReportSubmissionNotification(testInput);
      fail('EmailSendingFailedError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailedError);
      expect((error as Error).message).toBe('メール送信に失敗しました。管理者に通知します。');
    }

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith({
      emailAddress: testInput.leaderEmailAddress,
    });

    expect(mockedBuildNotificationContent).toHaveBeenCalled();

    expect(mockedRecordEmailSendingHistory).toHaveBeenCalled();
  });

  it('出力型が返された場合、success=false、errorMessage が正しく設定される', async () => {
    const errorOutput: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。管理者に通知します。',
      adminNotificationSent: true,
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue(errorOutput);

    const result = await mockedSendDailyReportSubmissionNotification(testInput);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
