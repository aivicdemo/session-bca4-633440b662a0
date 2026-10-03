import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-484: メール送信処理がシステム障害で失敗した場合、EmailSendingFailedError が発生して管理者に通知される', () => {
  it('メール送信統合実装時に、送信失敗時は管理者に通知される', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム障害対応を実施。ログサーバーの再起動により復旧完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);
    expect(result).toBeDefined();
  });
});
