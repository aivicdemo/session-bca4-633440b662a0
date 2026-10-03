import { sendDailyReportSubmissionNotification, LeaderEmailAddressNotFoundError } from '../../src/logic/email-notification-management';

describe('SCEN-498: チームリーダーのメールアドレスが登録されていない場合のエラー', () => {
  it('leaderEmailAddress が空文字列の場合、LeaderEmailAddressNotFoundError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
    );
  });

  it('leaderEmailAddress が null の場合、LeaderEmailAddressNotFoundError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: null as any,
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
    );
  });
});
