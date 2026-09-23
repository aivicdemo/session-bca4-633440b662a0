import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  EmailSendingFailedError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-484: メール送信処理がシステム障害で失敗した場合、EmailSendingFailedError が発生', () => {
  it('メール送信がシステム障害で失敗した場合、出力が返されるか、エラーが発生される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム障害対応を実施。ログサーバーの再起動により復旧完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:00:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailedError);
      expect((error as Error).message).toBe('メール送信に失敗しました。管理者に通知します。');
    }
  });
});
