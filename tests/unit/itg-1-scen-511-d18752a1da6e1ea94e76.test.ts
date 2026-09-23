// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification, DailyReportContentInvalidError } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
  DailyReportContentInvalidError: class DailyReportContentInvalidError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DailyReportContentInvalidError';
    }
  },
} as any));

describe('SCEN-511: 報告内容が空のテキストの場合', () => {
  test('DailyReportContentInvalidError がスローされ、エラーメッセージを返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected DailyReportContentInvalidError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DailyReportContentInvalidError);
      expect((error as DailyReportContentInvalidError).message).toBe(
        '日報の内容が不完全であるため、通知メールを生成できません。'
      );
    }
  });
});
