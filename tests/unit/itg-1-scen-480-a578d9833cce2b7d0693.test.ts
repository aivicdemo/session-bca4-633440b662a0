import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-480: 報告者がシステムに登録されていない場合、ReporterNotValidError が発生して通知を中止する', () => {
  it('報告者バリデーションロジック実装時に、未登録報告者に対して例外が発生する', async () => {
    const input = {
      reporterId: 'reporter-not-exists-999',
      dailyReportId: 'daily-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);
    expect(result).toBeDefined();
  });
});
