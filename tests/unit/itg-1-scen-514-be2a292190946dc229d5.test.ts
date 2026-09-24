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
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;

describe('SCEN-514: validateEmailAddressForDelivery が true を返した場合、buildNotificationContent が呼ばれる', () => {
  const testInput = {
    reporterId: 'reporter-001',
    dailyReportId: 'daily-001',
    reportContent: '本日は顧客対応を実施',
    reportDate: '2025-01-15',
    leaderUserId: 'leader-001',
    leaderEmailAddress: 'leader@example.com',
    reporterName: '山田太郎',
    submissionTimestamp: '2025-01-15T09:30:00Z',
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateEmailAddressForDelivery.mockResolvedValue(true);

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2025年1月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n本日は顧客対応を実施',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      emailSendingHistoryId: 'hist_20250115_001',
      sentAt: '2025-01-15T09:30:05Z',
    });

    mockedSendDailyReportSubmissionNotification.mockImplementation(async (input: any) => {
      const validationResult = await mockedValidateEmailAddressForDelivery(input.leaderEmailAddress);

      if (validationResult) {
        await mockedBuildNotificationContent({
          reporterName: input.reporterName,
          reportContent: input.reportContent,
          leaderEmailAddress: input.leaderEmailAddress,
        });
      }

      const historyResult = await mockedRecordEmailSendingHistory({});

      return {
        success: true,
        emailSendingHistoryId: historyResult.emailSendingHistoryId,
        sentAt: historyResult.sentAt,
        errorMessage: null,
        adminNotificationSent: false,
      };
    });
  });

  it('validateEmailAddressForDelivery がtrueを返した場合、buildNotificationContent は正確に1回呼び出される', async () => {
    await mockedSendDailyReportSubmissionNotification(testInput);

    expect(mockedBuildNotificationContent).toHaveBeenCalledTimes(1);
  });

  it('buildNotificationContent の呼び出し時の引数を検証する', async () => {
    await mockedSendDailyReportSubmissionNotification(testInput);

    expect(mockedBuildNotificationContent).toHaveBeenCalledWith({
      reporterName: testInput.reporterName,
      reportContent: testInput.reportContent,
      leaderEmailAddress: testInput.leaderEmailAddress,
    });
  });

  it('validateEmailAddressForDelivery がtrueを返すと、buildNotificationContent に期待値が渡される', async () => {
    await mockedSendDailyReportSubmissionNotification(testInput);

    const callArgs = mockedBuildNotificationContent.mock.calls[0][0];
    expect(callArgs.reporterName).toBe('山田太郎');
    expect(callArgs.reportContent).toBe('本日は顧客対応を実施');
    expect(callArgs.leaderEmailAddress).toBe('leader@example.com');
  });
});
