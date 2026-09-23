// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any).mockResolvedValue(true),
  buildNotificationContent: (jest.fn() as any).mockResolvedValue({
    subject: '【日報】2024年01月15日 山田太郎',
    body: '山田太郎さんからの日報です\n\n顧客A社のシステム要件定義会議を実施。基本設計書のドラフト完了。明日は詳細設計に着手予定。',
  }),
  recordEmailSendingHistory: (jest.fn() as any).mockResolvedValue({
    emailSendingHistoryId: 'HIST202401150001',
    sentAt: '2024-01-15T09:30:05Z',
  }),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
} as any));

describe('SCEN-516: buildNotificationContent が正常にメール本文を生成した場合', () => {
  test('recordEmailSendingHistory が適切なパラメータで呼び出される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'RPT001',
      dailyReportId: 'DR20240115001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本設計書のドラフト完了。明日は詳細設計に着手予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'LDR001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('HIST202401150001');
    expect(result.sentAt).toBe('2024-01-15T09:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    const { recordEmailSendingHistory } = require('../../src/logic/email-notification-management');
    expect(recordEmailSendingHistory).toHaveBeenCalled();
  });
});
