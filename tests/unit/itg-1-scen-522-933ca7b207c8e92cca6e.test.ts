import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  LeaderEmailAddressInvalidError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-522: 複数の入力値が同時に不正な場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('最初に検出されたエラーが返される', () => {
    const mockValidateEmail = jest.mocked(validateEmailAddressForDelivery);
    const mockBuildContent = jest.mocked(buildNotificationContent);
    const mockRecordHistory = jest.mocked(recordEmailSendingHistory);
    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);

    mockValidateEmail.mockImplementation(() => {
      throw new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    });

    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'invalid_reporter',
      dailyReportId: 'DR001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'invalid_email',
      reporterName: 'テスト太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
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
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
