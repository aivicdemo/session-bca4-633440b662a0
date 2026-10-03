import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressInvalidError,
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput
} from '../../src/logic/email-notification-management';

describe('SCEN-491: リーダーメールアドレスが空または不正な形式の場合、validateAndRouteLeaderNotification で「有効なメールアドレスを登録してください」のエラーが発生する', () => {
  it('should throw LeaderEmailAddressInvalidError for invalid email format with spaces', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Today I completed the project setup and started development.',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid email format',
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
  });

  it('should throw LeaderEmailAddressInvalidError with correct message for invalid format', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Daily report content',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid format',
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected LeaderEmailAddressInvalidError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    }
  });

  it('should throw LeaderEmailAddressInvalidError for email missing domain', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Daily report content',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'test@',
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressInvalidError);
  });
});
