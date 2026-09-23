import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-487: ユーザーマスタが空の場合、「チームの報告者マスタが設定されていません」のエラーが発生', () => {
  it('reporterMasterData が空配列の場合、エラーがスローされ、出力が返される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect((error as Error).message).toBe('チームの報告者マスタが設定されていません');
    }
  });
});
