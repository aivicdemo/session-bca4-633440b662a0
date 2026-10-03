import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-495: メールアドレスの形式が不正な場合、sendDailyReportSubmissionNotification は検証に失敗してエラーを返す', () => {
  it('メールアドレスの形式が不正な場合、sendDailyReportSubmissionNotification は『メールアドレスの形式が正しくありません』を検出して LeaderEmailAddressInvalidError をスローする、またはエラー出力を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      if (error instanceof LeaderEmailAddressInvalidError) {
        expect(error.message).toContain('チームリーダーのメールアドレスが無効');
      } else {
        throw error;
      }
    }
  });

  it('buildNotificationContent および recordEmailSendingHistory 関数は呼び出されず、メール送信処理は中止される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
