// @ts-ignore
import { describe, test, expect, jest } from '@jest/globals';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput } from '../../src/logic/email-notification-management';

// @ts-ignore
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: (jest.fn() as any).mockResolvedValue(true),
  buildNotificationContent: (jest.fn() as any).mockResolvedValue({
    subject: '【日報】2024年01月15日 山田太郎',
    body: '山田太郎さんからの日報です\n\n本日の業務：システムテスト実施、成果：テスト仕様書作成完了、課題：なし、明日の予定：レビュー対応',
  }),
  recordEmailSendingHistory: (jest.fn() as any).mockRejectedValue(
    new Error('メール送信に失敗しました。後で再試行してください')
  ),
  sendDailyReportSubmissionNotification: jest.fn() as any,
}));

describe('SCEN-508: メール送信サービスが一時的に利用不可の場合', () => {
  test('メール送信に失敗時、エラーメッセージを返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日の業務：システムテスト実施、成果：テスト仕様書作成完了、課題：なし、明日の予定：レビュー対応',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。後で再試行してください');
    expect(result.adminNotificationSent).toBe(true);
  });
});
