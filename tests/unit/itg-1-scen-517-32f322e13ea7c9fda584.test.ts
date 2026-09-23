import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-517: メール送信に成功した場合', () => {
  let mockValidateEmailAddressForDelivery: any;
  let mockBuildNotificationContent: any;
  let mockRecordEmailSendingHistory: any;

  beforeEach(() => {
    // スタブ化：validateEmailAddressForDelivery は有効なメールアドレスに対して true を返す
    mockValidateEmailAddressForDelivery = jest.fn(
      (email: string) => true
    );

    // スタブ化：buildNotificationContent は報告者名・日報内容・提出日時を含むメール本文オブジェクトを返す
    mockBuildNotificationContent = jest.fn(
      (reporterName: string, reportContent: string, submissionTimestamp: string) => ({
        toAddress: 'leader@example.com',
        subject: `日報提出通知: ${reporterName}`,
        body: `報告者: ${reporterName}\n内容: ${reportContent}\n提出日時: ${submissionTimestamp}`,
      })
    );

    // スタブ化：recordEmailSendingHistory は UUID形式のメール送信履歴IDと現在時刻を返す
    mockRecordEmailSendingHistory = jest.fn(
      () => ({
        emailSendingHistoryId: '550e8400-e29b-41d4-a716-446655440000',
        sentAt: new Date('2025-01-15T18:30:00Z').toISOString(),
      })
    );
  });

  it('should return success=true with emailSendingHistoryId and sentAt when email is sent successfully', async () => {
    // 入力値を構築
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客A社のシステム改修に従事。設計書作成完了。明日は実装予定。',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T18:30:00Z',
    };

    // sendDailyReportSubmissionNotification 関数を上記入力値で呼び出す
    const result: SendDailyReportSubmissionNotificationOutput =
      await sendDailyReportSubmissionNotification(input);

    // 返却された出力型 SendDailyReportSubmissionNotificationOutput を検証する
    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBeDefined();
    expect(result.emailSendingHistoryId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(result.sentAt).toBeDefined();
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    // 提出日時以降であることを確認
    expect(new Date(result.sentAt!).getTime()).toBeGreaterThanOrEqual(
      new Date(input.submissionTimestamp).getTime()
    );
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    // validateEmailAddressForDelivery スタブが leaderEmailAddress='leader@example.com' で呼ばれたこと
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalledWith('leader@example.com');

    // buildNotificationContent スタブが呼ばれたこと
    expect(mockBuildNotificationContent).toHaveBeenCalled();

    // recordEmailSendingHistory スタブが呼ばれたこと
    expect(mockRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
