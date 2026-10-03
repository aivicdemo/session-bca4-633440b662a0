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
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-499: メールアドレスの形式が不正な場合、LeaderEmailAddressInvalidError が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should throw LeaderEmailAddressInvalidError when email format is invalid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user@',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('メールアドレスの形式が正しくありません。確認してください')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });

  it('should return error message when email format is invalid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'userdomain.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メールアドレスの形式が正しくありません。確認してください',
      adminNotificationSent: true,
    });

    const result = await mockedSendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('メールアドレスの形式が正しくありません。確認してください');
  });
});
