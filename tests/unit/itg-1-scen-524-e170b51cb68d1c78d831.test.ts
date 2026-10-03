import { sendDailyReportSubmissionNotification, LeaderEmailAddressNotFoundError } from '../../src/logic/email-notification-management';

describe('SCEN-524: リーダーメールアドレスが null の場合、送信を中止してエラーを返す', () => {
  it('should throw LeaderEmailAddressNotFoundError when leaderEmailAddress is null', async () => {
    const input = {
      reporterId: 'reporter-1',
      dailyReportId: 'report-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-1',
      leaderEmailAddress: null as any,
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(LeaderEmailAddressNotFoundError);
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      'リーダーのメールアドレスが設定されていません。管理者に連絡してください'
    );
  });
});
