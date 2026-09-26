import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressInvalidError,
  type SendDailyReportSubmissionNotificationInput,
  type SendDailyReportSubmissionNotificationOutput
} from '../../src/logic/email-notification-management';

describe('SCEN-491: リーダーメールアドレスが空または不正な形式の場合、sendDailyReportSubmissionNotification でエラーが発生する', () => {
  it('should return error when leader email address is empty', async () => {
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
    expect(result.errorMessage).toBe('有効なメールアドレスを登録してください');
    expect(result.adminNotificationSent).toBe(true);
  });

  it('should throw LeaderEmailAddressInvalidError or return error for empty email', async () => {
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
      expect(result.errorMessage).toBe('有効なメールアドレスを登録してください');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect((error as Error).message).toContain('チームリーダーのメールアドレスが無効');
    }
  });
});
