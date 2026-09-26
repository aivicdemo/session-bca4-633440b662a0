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
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-498: チームリーダーのメールアドレスが登録されていない場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should throw LeaderEmailAddressNotFoundError when email address is empty', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressNotFoundError('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );
  });

  it('should return error output when email address is not found', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。',
      adminNotificationSent: true,
    });

    const result = await mockedSendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toContain('チームリーダーのメールアドレスが登録されていないため');
    expect(result.adminNotificationSent).toBe(true);
  });
});
