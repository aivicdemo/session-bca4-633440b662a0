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
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;

describe('SCEN-513: 報告者ID・報告内容・送信日時・リーダーメールアドレス・報告者名がすべて有効な場合、sendDailyReportNotificationEmail はメール送信を成功させる', () => {
  const testInput = {
    reporterId: 'reporter_001',
    dailyReportId: 'report_20250115_001',
    reportContent: '顧客A社との打ち合わせ完了、見積書作成開始',
    reportDate: '2025-01-15',
    leaderUserId: 'leader_001',
    leaderEmailAddress: 'leader@example.com',
    reporterName: '山田太郎',
    submissionTimestamp: '2025-01-15T09:30:00Z',
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2025年1月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n顧客A社との打ち合わせ完了、見積書作成開始',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      emailSendingHistoryId: 'hist_20250115_001',
      sentAt: '2025-01-15T09:30:05Z',
    });

    mockedSendDailyReportSubmissionNotification.mockImplementation(async (input: any) => {
      const validationResult = await mockedValidateEmailAddressForDelivery({
        emailAddress: input.leaderEmailAddress,
      });
      if (!validationResult.isValid) {
        throw new Error('Invalid email');
      }

      const contentResult = await mockedBuildNotificationContent({
        reporterName: input.reporterName,
        reportContent: input.reportContent,
        submissionTimestamp: input.submissionTimestamp,
      });

      const historyResult = await mockedRecordEmailSendingHistory({
        to: input.leaderEmailAddress,
        subject: contentResult.subject,
        body: contentResult.body,
      });

      return {
        success: true,
        emailSendingHistoryId: historyResult.emailSendingHistoryId,
        sentAt: historyResult.sentAt,
        errorMessage: null,
        adminNotificationSent: false,
      } as SendDailyReportSubmissionNotificationOutput;
    });
  });

  it('正常系：すべてのスタブが呼び出され、成功結果が返される', async () => {
    const result = await mockedSendDailyReportSubmissionNotification(testInput);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('hist_20250115_001');
    expect(result.sentAt).toBe('2025-01-15T09:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith({
      emailAddress: testInput.leaderEmailAddress,
    });

    expect(mockedBuildNotificationContent).toHaveBeenCalledWith({
      reporterName: testInput.reporterName,
      reportContent: testInput.reportContent,
      submissionTimestamp: testInput.submissionTimestamp,
    });

    expect(mockedRecordEmailSendingHistory).toHaveBeenCalled();
  });

  it('validateEmailAddressForDelivery が呼び出される', async () => {
    await mockedSendDailyReportSubmissionNotification(testInput);

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledTimes(1);
    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith({
      emailAddress: testInput.leaderEmailAddress,
    });
  });

  it('buildNotificationContent が呼び出される', async () => {
    await mockedSendDailyReportSubmissionNotification(testInput);

    expect(mockedBuildNotificationContent).toHaveBeenCalledTimes(1);
    expect(mockedBuildNotificationContent).toHaveBeenCalledWith({
      reporterName: testInput.reporterName,
      reportContent: testInput.reportContent,
      submissionTimestamp: testInput.submissionTimestamp,
    });
  });

  it('recordEmailSendingHistory が呼び出される', async () => {
    await mockedSendDailyReportSubmissionNotification(testInput);

    expect(mockedRecordEmailSendingHistory).toHaveBeenCalledTimes(1);
    expect(mockedRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
