import { sendDailyReportSubmissionNotification, LeaderEmailAddressInvalidError } from '../../src/logic/email-notification-management';

describe('SCEN-499: メールアドレスの形式が不正な場合のエラー', () => {
  it('不正な形式のメールアドレスの場合、LeaderEmailAddressInvalidError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user@',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });

  it('@domain.com 形式のメールアドレスは不正と判定される', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '@domain.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });

  it('スペースを含むメールアドレスは不正と判定される', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user name@domain.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });
});
