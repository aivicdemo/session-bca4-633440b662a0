import { sendDailyReportSubmissionNotification, ReporterNotValidError } from '../../src/logic/email-notification-management';

describe('SCEN-526: 報告者が無効化された状態である場合、ReporterNotValidError が発生する', () => {
  it('should throw ReporterNotValidError when reporterId is invalid', async () => {
    const input = {
      reporterId: 'invalid-reporter-id',
      dailyReportId: 'report-20240115',
      reportContent: '本日は顧客A社のシステム要件ヒアリングを実施した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(ReporterNotValidError);
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      '報告者が無効であるため、メール通知を送信できません。'
    );
  });
});
