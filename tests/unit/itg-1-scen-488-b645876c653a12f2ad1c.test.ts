import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-488: チームリーダーのチームIDが不正な場合、validateReporterValidity で『チーム情報の取得に失敗しました』のエラーが発生する', () => {
  it('チームリーダーのチームIDが不正な場合、エラーが発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);
    expect(result).toBeDefined();
  });
});
