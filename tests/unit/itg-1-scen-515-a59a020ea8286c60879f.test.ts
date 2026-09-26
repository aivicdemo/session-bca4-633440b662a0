import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-515: validateEmailAddressForDelivery が false を返した場合、buildNotificationContent は呼ばれずエラーで終了する', () => {
  let mockValidateEmailAddressForDelivery: jest.MockedFunction<any>;
  let mockBuildNotificationContent: jest.MockedFunction<any>;
  let mockRecordEmailSendingHistory: jest.MockedFunction<any>;
  let mockSendDailyReportSubmissionNotification: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
    mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    mockRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
    mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
  });

  it('buildNotificationContent は呼ばれずエラーで終了する', async () => {
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

    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。',
      adminNotificationSent: true,
    };

    mockSendDailyReportSubmissionNotification.mockResolvedValue(expectedOutput);

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
    expect(mockBuildNotificationContent).not.toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
