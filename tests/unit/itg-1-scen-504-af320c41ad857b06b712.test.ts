import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-504: 報告者の氏名が登録されていない場合のエラー', () => {
  it('reporterName が空文字列の場合、エラーが発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施。要件ヒアリング完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow();
  });
});
