import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-524: リーダーメールアドレスが null の場合、送信を中止してエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderEmailAddressNotFoundError when leaderEmailAddress is null', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-1',
      dailyReportId: 'report-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-1',
      leaderEmailAddress: null,
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    jest.mocked(validateEmailAddressForDelivery).mockImplementation((email) => {
      if (email === null || email === undefined) {
        throw new LeaderEmailAddressNotFoundError(
          'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
        );
      }
      return Promise.resolve({ isValid: true });
    });

    const mockRecordEmailSendingHistory = jest.mocked(recordEmailSendingHistory);
    const mockBuildNotificationContent = jest.mocked(buildNotificationContent);

    await expect(
      sendDailyReportSubmissionNotification(input)
    ).rejects.toThrow(LeaderEmailAddressNotFoundError);

    expect(mockBuildNotificationContent).not.toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
