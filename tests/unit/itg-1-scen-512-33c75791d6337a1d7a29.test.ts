// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification, EmailSendingFailedError } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any).mockResolvedValue(true),
  buildNotificationContent: (jest.fn() as any).mockResolvedValue({
    subject: '【日報】2024年01月15日 田中太郎',
    body: '田中太郎さんからの日報です\n\n本日は顧客A社との打ち合わせ完了。明日は資料作成予定。',
  }),
  recordEmailSendingHistory: (jest.fn() as any).mockRejectedValue(
    new Error('メール送信に失敗しました。管理者に通知します。')
  ),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
  EmailSendingFailedError: class EmailSendingFailedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'EmailSendingFailedError';
    }
  },
} as any));

describe('SCEN-512: メール送信に失敗した場合', () => {
  test('EmailSendingFailedError がスローされ、管理者に通知される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A社との打ち合わせ完了。明日は資料作成予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:00:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected EmailSendingFailedError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailedError);
      expect((error as EmailSendingFailedError).message).toBe(
        'メール送信に失敗しました。管理者に通知します。'
      );
    }
  });
});
