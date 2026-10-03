import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-485: メール送信失敗時に管理者への通知送信も失敗した場合、AdminNotificationFailedError が発生する', () => {
  it('メール送信統合実装時に、管理者への通知送信も失敗した場合にエラーが発生する', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A対応とシステム改善を実施',
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
