import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
const mockedBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-479: 正常系：有効なリーダーメールアドレスに対して提出通知メールが送信され、送信履歴が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-uuid-001',
      sentAt: '2024-01-15T18:30:01Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    const result: SendDailyReportSubmissionNotificationOutput = await mockedSendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-uuid-001');
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).toBeDefined();
    expect(typeof result.sentAt).toBe('string');
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
