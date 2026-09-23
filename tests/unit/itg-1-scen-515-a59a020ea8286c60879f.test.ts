// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any).mockResolvedValue(false),
  buildNotificationContent: (jest.fn() as any),
  recordEmailSendingHistory: (jest.fn() as any),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
} as any));

describe('SCEN-515: validateEmailAddressForDelivery が false を返した場合', () => {
  test('buildNotificationContent と recordEmailSendingHistory が呼ばれず、エラーで終了', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter001',
      dailyReportId: 'report001',
      reportContent: '本日の業務内容',
      reportDate: '2025-01-15',
      leaderUserId: 'leader001',
      leaderEmailAddress: 'invalid-email',
      reporterName: '山田太郎',
      submissionTimestamp: '2025-01-15T09:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);

    const { buildNotificationContent, recordEmailSendingHistory } = require('../../src/logic/email-notification-management');
    expect(buildNotificationContent).not.toHaveBeenCalled();
    expect(recordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
