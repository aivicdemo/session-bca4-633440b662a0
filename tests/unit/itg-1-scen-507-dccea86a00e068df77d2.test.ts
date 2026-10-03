import { sendDailyReportSubmissionNotification, LeaderEmailAddressInvalidError } from '../../src/logic/email-notification-management';

describe('SCEN-507: メールアドレスの形式が不正な場合', () => {
  it('不正な形式のメールアドレスの場合、LeaderEmailAddressInvalidError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: 'テスト',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });
});
