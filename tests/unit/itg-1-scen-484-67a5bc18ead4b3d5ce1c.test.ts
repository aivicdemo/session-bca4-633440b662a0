jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  EmailSendingFailedError,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-484: メール送信処理がシステム障害で失敗した場合、EmailSendingFailedError が発生して管理者に通知される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('メール送信に失敗した場合、EmailSendingFailedError が発生し、管理者に通知されること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム障害対応を実施。ログサーバーの再起動により復旧完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:00:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日はシステム障害対応を実施。ログサーバーの再起動により復旧完了。',
    });

    const emailSendingError = new EmailSendingFailedError('メール送信に失敗しました。管理者に通知します。');
    mockedRecordEmailSendingHistory.mockRejectedValue(emailSendingError);

    try {
      await sendDailyReportSubmissionNotification(input);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailedError);
      expect((error as Error).message).toBe('メール送信に失敗しました。管理者に通知します。');
    }

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalled();
    expect(mockedBuildNotificationContent).toHaveBeenCalled();
  });
});
