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

describe('SCEN-515: validateEmailAddressForDelivery が false を返した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('buildNotificationContent は呼ばれずエラーで終了する', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockReturnValue(false);

    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report001',
      reportContent: '本日の業務内容',
      reportDate: '2025-01-15',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'invalid-email',
      reporterName: '山田太郎',
      submissionTimestamp: '2025-01-15T09:00:00Z',
    };

    mockSend.mockImplementation(() => ({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。',
      adminNotificationSent: true,
    }));

    const result = mockSend(input) as SendDailyReportSubmissionNotificationOutput;

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
    expect(mockBuildContent).not.toHaveBeenCalled();
    expect(mockRecordHistory).not.toHaveBeenCalled();
  });
});
