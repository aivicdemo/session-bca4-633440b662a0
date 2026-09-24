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

describe('SCEN-519: メール送信に失敗し管理者への通知も失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=false でadminNotificationSent=false になる', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockReturnValue(true);
    mockBuildContent.mockReturnValue({
      subject: '【日報】2025年01月15日 報告者太郎',
      body: '報告者太郎さんからの日報です\n\n今日の業務内容',
      toAddress: 'leader@example.com',
    });
    mockRecordHistory.mockReturnValue(null);

    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'R001',
      dailyReportId: 'DR001',
      reportContent: '今日の業務内容',
      reportDate: '2025-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者太郎',
      submissionTimestamp: '2025-01-15T10:30:00Z',
    };

    mockSend.mockImplementation(() => ({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。管理者に通知します。',
      adminNotificationSent: false,
    }));

    const result = mockSend(input) as SendDailyReportSubmissionNotificationOutput;

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(result.adminNotificationSent).toBe(false);
  });
});
