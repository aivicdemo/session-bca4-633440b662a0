import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification, DailyReportContentInvalidError } from '../../src/logic/email-notification-management';

describe('SCEN-483: 日報の入力内容が空白または必須項目が不足している場合、DailyReportContentInvalidError が発生してメール生成に失敗する', () => {
  it('reportContent が空文字列の場合、DailyReportContentInvalidError が発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(DailyReportContentInvalidError);
  });
});
