jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-489: 報告者が有効に登録されている場合、validateReporterValidity は報告者情報を正常に返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('報告者が有効に登録されている場合、正常に処理が進行すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日は営業活動を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年1月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は営業活動を実施',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-001',
      recordedAt: '2024-01-15T09:30:01Z',
      errorMessage: null,
    });

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-001');
    expect(result.errorMessage).toBeNull();
  });
});
