import { sendDailyReportSubmissionNotification, LeaderEmailAddressNotFoundError } from '../../src/logic/email-notification-management';

describe('SCEN-506: リーダーのメールアドレスが登録されていない場合（空文字列）', () => {
  it('leaderEmailAddress が空文字列の場合、LeaderEmailAddressNotFoundError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
    );
  });
});
