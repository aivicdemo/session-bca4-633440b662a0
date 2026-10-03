import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput
} from '../../src/logic/email-notification-management';

describe('SCEN-492: リーダーメールアドレスが登録されていない場合、validateAndRouteLeaderNotification で「リーダーメールアドレスの登録が必要です」のエラーが発生する', () => {
  it('should throw LeaderEmailAddressNotFoundError when leader email is empty string', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Today I completed the project setup and started development.',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressNotFoundError);
  });

  it('should throw LeaderEmailAddressNotFoundError when leader email is null', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Today I completed the project setup and started development.',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: null as any,
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressNotFoundError);
  });

  it('should throw LeaderEmailAddressNotFoundError with correct message for unregistered email', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Daily report content',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected LeaderEmailAddressNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });

  it('should check that validateAndRouteLeaderNotification is called for registration check', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: 'Daily report content to verify registration requirement',
      reportDate: '2026-09-26',
      leaderUserId: 'leader-001',
      leaderEmailAddress: null as any,
      reporterName: 'John Doe',
      submissionTimestamp: '2026-09-26T18:30:00Z'
    };

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
    }
  });
});
