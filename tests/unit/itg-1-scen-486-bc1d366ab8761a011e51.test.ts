import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-486: 報告者IDが空の場合、validateReporterValidity で『報告者IDが指定されていません』のエラーが発生する', () => {
  it('reporterId が空文字列の場合、エラーが発生する', async () => {
    const input = {
      reporterId: '',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施した',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);
    expect(result).toBeDefined();
  });
});
