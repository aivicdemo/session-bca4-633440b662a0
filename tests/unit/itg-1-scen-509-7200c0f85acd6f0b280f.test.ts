// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any).mockResolvedValue(true),
  buildNotificationContent: (jest.fn() as any).mockResolvedValue({
    subject: '【日報】2025年01月15日 山田太郎',
    body: '山田太郎さんからの日報です\n\n本日は顧客A社との打ち合わせを実施。成果物の仕様書初版を完成させた。課題は承認待ち。明日は顧客レビュー対応予定。',
  }),
  recordEmailSendingHistory: (jest.fn() as any).mockResolvedValue({
    emailSendingHistoryId: 'hist_20250115_001',
    sentAt: '2025-01-15T18:00:05Z',
  }),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
} as any));

describe('SCEN-509: 有効なリーダーメールアドレスと報告内容が揃っている場合', () => {
  test('メール送信に成功し、適切な出力を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20250115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施。成果物の仕様書初版を完成させた。課題は承認待ち。明日は顧客レビュー対応予定。',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2025-01-15T18:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('hist_20250115_001');
    expect(result.sentAt).toBe('2025-01-15T18:00:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
