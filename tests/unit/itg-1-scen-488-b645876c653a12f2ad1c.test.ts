import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-488: チームリーダーのチームIDが不正な場合、「チーム情報の取得に失敗しました」のエラーが発生', () => {
  it('leaderUserIdのチームIDが不正な場合、エラーがスローされ、出力が返される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-with-invalid-team-id',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('チーム情報の取得に失敗しました');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect((error as Error).message).toBe('チーム情報の取得に失敗しました');
    }
  });
});
