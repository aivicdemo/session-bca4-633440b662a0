// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any).mockResolvedValue(true),
  buildNotificationContent: (jest.fn() as any).mockResolvedValue({
    subject: '【日報】2025年1月15日 山田太郎',
    body: '山田太郎さんからの日報です\n\n本日は顧客対応を実施',
  }),
  recordEmailSendingHistory: (jest.fn() as any).mockResolvedValue({
    emailSendingHistoryId: 'hist_001',
    sentAt: '2025-01-15T09:30:05Z',
  }),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
} as any));

describe('SCEN-514: validateEmailAddressForDelivery が true を返した場合、buildNotificationContent が呼ばれる', () => {
  test('buildNotificationContent が正確に1回呼び出される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2025-01-15T09:30:00Z',
    };

    const { buildNotificationContent } = require('../../src/logic/email-notification-management');
    await sendDailyReportSubmissionNotification(input);

    expect(buildNotificationContent).toHaveBeenCalledTimes(1);
  });
});
