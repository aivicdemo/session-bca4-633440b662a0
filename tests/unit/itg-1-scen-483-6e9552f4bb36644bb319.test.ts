jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  DailyReportContentInvalidError,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-483: 日報の入力内容が空白または必須項目が不足している場合、DailyReportContentInvalidError が発生してメール生成に失敗する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('reportContent が空文字列の場合、DailyReportContentInvalidError が発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockedBuildNotificationContent.mockRejectedValue(
      new DailyReportContentInvalidError('日報の内容が不完全であるため、通知メールを生成できません。')
    );

    mockedRecordEmailSendingHistory.mockRejectedValue(new Error('Should not be called'));

    try {
      await sendDailyReportSubmissionNotification(input);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(DailyReportContentInvalidError);
      expect((error as Error).message).toBe('日報の内容が不完全であるため、通知メールを生成できません。');
    }

    expect(mockedBuildNotificationContent).toHaveBeenCalled();
    expect(mockedRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
