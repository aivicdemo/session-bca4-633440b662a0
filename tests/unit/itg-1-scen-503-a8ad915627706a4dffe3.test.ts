import { describe, it, expect } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
} from '../../src/logic/email-notification-management';

describe('SCEN-503: リーダーのメールアドレスが登録されていない場合のエラーハンドリング', () => {
  it('leaderEmailAddress が null の場合、success=false、errorMessage に LeaderEmailAddressNotFoundError の文言が格納される', async () => {
    const input = {
      reporterId: 'reporter001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader001',
      leaderEmailAddress: null, // リーダーのメールアドレスが登録されていない
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe(
      'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。'
    );
    expect(result.adminNotificationSent).toBe(true);
  });
});
