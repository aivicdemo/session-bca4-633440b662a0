import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  EmailSendingFailedError,
  AdminNotificationFailedError,
} from '../../src/logic/email-notification-management';

describe('SCEN-519: メール送信に失敗し管理者への通知も失敗した場合', () => {
  let mockValidateEmailAddressForDelivery: any;
  let mockBuildNotificationContent: any;
  let mockSendEmail: any;
  let mockNotifyAdmin: any;

  beforeEach(() => {
    // validateEmailAddressForDeliveryスタブをモック化
    // leaderEmailAddress='leader@example.com'に対して、バリデーション成功を返す
    mockValidateEmailAddressForDelivery = jest.fn(
      (email: string) => true
    );

    // buildNotificationContentスタブをモック化
    // reporterName、reportContent、submissionTimestampを受け取ってメール本文を生成し、正常なメール内容オブジェクトを返す
    mockBuildNotificationContent = jest.fn(
      (reporterName: string, reportContent: string, submissionTimestamp: string) => ({
        toAddress: 'leader@example.com',
        subject: `日報提出通知: ${reporterName}`,
        body: `報告者: ${reporterName}\n内容: ${reportContent}\n提出日時: ${submissionTimestamp}`,
      })
    );

    // メール送信処理をモック化
    // メール送信に失敗するよう設定し、EmailSendingFailedErrorをスロー
    mockSendEmail = jest.fn(
      () => {
        throw new EmailSendingFailedError('メール送信に失敗しました。管理者に通知します。');
      }
    );

    // 管理者への通知送信処理をモック化
    // 管理者通知の送信に失敗し、AdminNotificationFailedErrorをスロー
    mockNotifyAdmin = jest.fn(
      () => {
        throw new AdminNotificationFailedError('メール送信失敗の管理者通知に失敗しました。');
      }
    );
  });

  it('should return success=false with adminNotificationSent=false when both email and admin notification fail', async () => {
    // sendDailyReportSubmissionNotification関数の入力型として、以下の値を設定
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'R001',
      dailyReportId: 'DR001',
      reportContent: '今日の業務内容',
      reportDate: '2025-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者太郎',
      submissionTimestamp: '2025-01-15T10:30:00Z',
    };

    // sendDailyReportSubmissionNotification関数を呼び出す
    const result: SendDailyReportSubmissionNotificationOutput =
      await sendDailyReportSubmissionNotification(input);

    // 戻り値の出力型フィールドを検証
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(result.adminNotificationSent).toBe(false);
  });
});
