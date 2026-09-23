import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-502: 報告内容が空文字列の場合のエラーハンドリング', () => {
  it('reportContent が空文字列の場合、エラー「日報内容が入力されていません」をスローする', async () => {
    const input = {
      reporterId: 'reporter001',
      dailyReportId: 'report-123',
      reportContent: '', // 空文字列
      reportDate: new Date('2024-01-15'),
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(async () => {
      await sendDailyReportSubmissionNotification(input);
    }).rejects.toThrow('日報内容が入力されていません');
  });
});
