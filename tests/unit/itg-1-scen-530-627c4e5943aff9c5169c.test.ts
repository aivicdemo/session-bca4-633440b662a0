import { describe, it, expect, beforeEach } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';
import type {
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-530: submissionTimestamp が ISO 8601 形式でない場合の処理動作', () => {
  const validInput = {
    reporterId: 'valid-reporter-001',
    dailyReportId: 'report-123',
    reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
    reportDate: '2024-01-15',
    leaderUserId: 'leader-001',
    leaderEmailAddress: 'leader@example.com',
    reporterName: '田中太郎',
  };

  const testCases = [
    { submissionTimestamp: '2024-01-15 10:30:00', description: '形式不正（スペース区切り）' },
    { submissionTimestamp: 'invalid-date', description: '不正な文字列' },
    { submissionTimestamp: '', description: '空文字列' },
    { submissionTimestamp: null, description: 'null' },
  ];

  testCases.forEach(({ submissionTimestamp, description }) => {
    it(`submissionTimestamp が ${description} のとき、形式検証失敗とエラー通知を返すこと`, async () => {
      const input: SendDailyReportSubmissionNotificationInput = {
        ...validInput,
        submissionTimestamp: submissionTimestamp as any,
      };

      const result = await sendDailyReportSubmissionNotification(input);

      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBeTruthy();
      expect(result.errorMessage).toContain('submissionTimestamp');
      expect(result.errorMessage).toContain('ISO 8601');
      expect(result.adminNotificationSent).toBe(true);
    });
  });
});
