jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  AdminNotificationFailedError,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-485: メール送信失敗時に管理者への通知送信も失敗した場合、AdminNotificationFailedError が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('メール送信失敗後、管理者通知も失敗した場合、AdminNotificationFailedError が発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A対応とシステム改善を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です...',
    });

    mockedRecordEmailSendingHistory.mockRejectedValue(
      new AdminNotificationFailedError('メール送信失敗の管理者通知に失敗しました。')
    );

    try {
      await sendDailyReportSubmissionNotification(input);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(AdminNotificationFailedError);
      expect((error as Error).message).toBe('メール送信失敗の管理者通知に失敗しました。');
    }

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalled();
    expect(mockedBuildNotificationContent).toHaveBeenCalled();
    expect(mockedRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
