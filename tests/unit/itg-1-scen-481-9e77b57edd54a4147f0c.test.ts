import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-481: リーダーメールアドレスが形式的に無効な場合、LeaderEmailAddressInvalidError が発生', () => {
  it('リーダーメールアドレスが形式的に無効な場合、エラーが発生し、buildNotificationContent と recordEmailSendingHistory は呼ばれない', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A対応、提案資料作成完了',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email-format',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    }
  });
});
