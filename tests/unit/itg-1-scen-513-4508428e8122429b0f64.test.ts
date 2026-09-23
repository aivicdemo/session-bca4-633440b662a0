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
    body: '山田太郎さんからの日報です\n\n顧客A社との打ち合わせ完了、見積書作成開始',
  }),
  recordEmailSendingHistory: (jest.fn() as any).mockResolvedValue({
    emailSendingHistoryId: 'hist_20250115_001',
    sentAt: '2025-01-15T09:30:05Z',
  }),
  sendDailyReportSubmissionNotification: (jest.fn() as any),
} as any));

describe('SCEN-513: 報告者ID・報告内容・送信日時・リーダーメールアドレス・報告者名がすべて有効な場合', () => {
  test('メール送信に成功し、履歴を記録する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter_001',
      dailyReportId: 'report_20250115_001',
      reportContent: '顧客A社との打ち合わせ完了、見積書作成開始',
      reportDate: '2025-01-15',
      leaderUserId: 'leader_001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2025-01-15T09:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('hist_20250115_001');
    expect(result.sentAt).toBe('2025-01-15T09:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
