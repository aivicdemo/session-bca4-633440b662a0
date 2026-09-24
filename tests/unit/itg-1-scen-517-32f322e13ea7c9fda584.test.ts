import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-517: メール送信に成功した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=true でメール送信履歴IDと送信日時が返される', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockReturnValue(true);
    mockBuildContent.mockReturnValue({
      subject: '【日報】2025年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A社のシステム改修に従事。設計書作成完了。明日は実装予定。',
      toAddress: 'leader@example.com',
    });
    mockRecordHistory.mockReturnValue({
      emailSendingHistoryId: 'uuid-format-id-12345',
      sentAt: '2025-01-15T18:30:05Z',
    });

    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客A社のシステム改修に従事。設計書作成完了。明日は実装予定。',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T18:30:00Z',
    };

    mockSend.mockImplementation(() => ({
      success: true,
      emailSendingHistoryId: 'uuid-format-id-12345',
      sentAt: '2025-01-15T18:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    }));

    const result = mockSend(input) as SendDailyReportSubmissionNotificationOutput;

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(typeof result.emailSendingHistoryId).toBe('string');
    expect(result.sentAt).not.toBeNull();
    expect(typeof result.sentAt).toBe('string');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
    expect(mockValidateEmail).toHaveBeenCalledWith('leader@example.com');
    expect(mockBuildContent).toHaveBeenCalled();
    expect(mockRecordHistory).toHaveBeenCalled();
  });
});
