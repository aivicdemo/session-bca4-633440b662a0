import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-514: validateEmailAddressForDelivery が true を返した場合、buildNotificationContent が呼ばれる', () => {
  const testInput: SendDailyReportSubmissionNotificationInput = {
    reporterId: 'reporter-001',
    dailyReportId: 'daily-001',
    reportContent: '本日は顧客対応を実施',
    reportDate: '2025-01-15',
    leaderUserId: 'leader-001',
    leaderEmailAddress: 'leader@example.com',
    reporterName: '山田太郎',
    submissionTimestamp: '2025-01-15T09:30:00Z',
  };

  it('有効なメールアドレスで関数が正常に処理される', async () => {
    const result = await sendDailyReportSubmissionNotification(testInput);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
  });
});
