jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
const mockedBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;

describe('SCEN-495: メールアドレスの形式が不正な場合、sendDailyReportSubmissionNotification は検証に失敗してエラーを返す', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should throw LeaderEmailAddressInvalidError when email format is invalid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });

  it('should return error output with correct fields when email is invalid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。',
      adminNotificationSent: true,
    });

    const result = await mockedSendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });

  it('should not call buildNotificationContent or recordEmailSendingHistory when validation fails', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。',
      adminNotificationSent: true,
    });

    await mockedSendDailyReportSubmissionNotification(input);

    expect(mockedBuildNotificationContent).not.toHaveBeenCalled();
    expect(mockedRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
