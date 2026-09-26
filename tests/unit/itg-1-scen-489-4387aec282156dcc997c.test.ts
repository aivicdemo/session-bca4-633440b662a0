import { describe, it, expect } from '@jest/globals';
import { sendDailyReportSubmissionNotification, type SendDailyReportSubmissionNotificationInput, type SendDailyReportSubmissionNotificationOutput } from '../../src/logic/email-notification-management';

describe('SCEN-489: 報告者が有効に登録されている場合、sendDailyReportSubmissionNotification は報告者情報を含む通知を正常に送信する', () => {
  it('有効に登録されている報告者の日報提出通知を正常に送信できること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務を完了しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T17:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBeDefined();
    expect(result.sentAt).toBeDefined();
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('報告者の名前がメール送信履歴に記録されること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務を完了しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T17:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
  });

  it('報告者のメールアドレスが使用されて通知が送信されること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務を完了しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T17:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).not.toBeNull();
  });

  it('通知送信時の理由フィールドが空であること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務を完了しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T17:00:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(true);
    expect(result.errorMessage).toBeNull();
  });
});
