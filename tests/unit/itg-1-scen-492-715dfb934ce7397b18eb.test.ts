import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput
} from '../../src/logic/email-notification-management';

describe('SCEN-492: リーダーメールアドレスが登録されていない場合、sendDailyReportSubmissionNotification でエラーが発生する', () => {
  it('should return error when leader email address is not registered (empty)', async () => {
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

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });

  it('should return error when leader email address is not registered (null)', async () => {
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

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });

  it('should throw LeaderEmailAddressNotFoundError or return error for unregistered email', async () => {
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
      const result = await sendDailyReportSubmissionNotification(input);
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });
});
