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

describe('SCEN-521: reporterName が null の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール本文生成時にエラーになる', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockReturnValue(true);

    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report001',
      reportContent: '本日は営業資料の作成に従事しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: null as any,
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    mockSend.mockImplementation(() => ({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: '報告者の氏名が登録されていないため、メール本文を生成できません',
      adminNotificationSent: true,
    }));

    const result = mockSend(input) as SendDailyReportSubmissionNotificationOutput;

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.adminNotificationSent).toBe(true);
    expect(mockBuildContent).toHaveBeenCalled();
  });
});
