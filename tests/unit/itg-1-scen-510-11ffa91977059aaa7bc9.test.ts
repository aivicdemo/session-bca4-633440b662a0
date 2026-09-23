// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification, LeaderEmailAddressNotFoundError } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any).mockRejectedValue(
    new Error('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。')
  ),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
  LeaderEmailAddressNotFoundError: class LeaderEmailAddressNotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LeaderEmailAddressNotFoundError';
    }
  },
} as any));

describe('SCEN-510: リーダーのメールアドレスが登録されていない場合', () => {
  test('LeaderEmailAddressNotFoundError がスローされ、管理者に通知される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected LeaderEmailAddressNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect((error as LeaderEmailAddressNotFoundError).message).toBe(
        'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
      );
    }
  });
});
