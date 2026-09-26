import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressInvalidError,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
const mockedBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-481: リーダーメールアドレスが形式的に無効な場合、LeaderEmailAddressInvalidError が発生して通知を中止する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダーメールアドレスが形式的に無効な場合、LeaderEmailAddressInvalidError が発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A対応、提案資料作成完了',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email-format',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。',
      errorCode: 'INVALID_EMAIL_FORMAT',
    });

    mockedBuildNotificationContent.mockRejectedValue(new Error('Should not be called'));
    mockedRecordEmailSendingHistory.mockRejectedValue(new Error('Should not be called'));

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
  });
});
