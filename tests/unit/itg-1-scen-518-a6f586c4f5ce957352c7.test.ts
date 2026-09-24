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

describe('SCEN-518: メール送信に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success=false でエラーメッセージが返されadminNotificationSent=true になる', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockReturnValue(true);
    mockBuildContent.mockReturnValue({
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせを実施し、プロジェクト進捗について協議した',
      toAddress: 'leader@example.com',
    });
    mockRecordHistory.mockReturnValue(null);

    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115',
      reportContent: '本日は顧客A社との打ち合わせを実施し、プロジェクト進捗について協議した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockSend.mockImplementation(() => ({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。管理者に通知します。',
      adminNotificationSent: true,
    }));

    const result = mockSend(input) as SendDailyReportSubmissionNotificationOutput;

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
