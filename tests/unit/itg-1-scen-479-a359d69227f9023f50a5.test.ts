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
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-479: 正常系：有効なリーダーメールアドレスに対して提出通知メールが送信され、送信履歴が記録される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('有効なリーダーメールアドレスに対して提出通知メールが送信されること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report-2024-01-15-001',
      reportContent: '本日は顧客A向けシステム設計を実施。要件定義書を完成させた。明日は実装開始予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader001',
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
      subject: '【日報】2024年1月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A向けシステム設計を実施。要件定義書を完成させた。明日は実装開始予定。',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-uuid-001',
      recordedAt: '2024-01-15T18:30:01Z',
      errorMessage: null,
    });

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-uuid-001');
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).toBeDefined();
    expect(typeof result.sentAt).toBe('string');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'leader@example.com',
      })
    );
    expect(mockedBuildNotificationContent).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: '田中太郎',
        reportContent: '本日は顧客A向けシステム設計を実施。要件定義書を完成させた。明日は実装開始予定。',
        reportDate: '2024-01-15',
        submissionTimestamp: '2024-01-15T18:30:00Z',
      })
    );
    expect(mockedRecordEmailSendingHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        leaderUserId: 'leader001',
        leaderEmailAddress: 'leader@example.com',
        dailyReportId: 'report-2024-01-15-001',
      })
    );
  });
});
