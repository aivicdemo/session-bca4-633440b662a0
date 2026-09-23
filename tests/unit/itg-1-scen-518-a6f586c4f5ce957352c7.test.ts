import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  EmailSendingFailedError,
} from '../../src/logic/email-notification-management';

describe('SCEN-518: メール送信に失敗した場合', () => {
  let mockValidateEmailAddressForDelivery: any;
  let mockBuildNotificationContent: any;
  let mockRecordEmailSendingHistory: any;
  let mockSendEmail: any;

  beforeEach(() => {
    // 呼び出し先の処理 validateEmailAddressForDelivery をスタブ化
    // leaderEmailAddress='leader@example.com' に対して { isValid: true } を返すように設定
    mockValidateEmailAddressForDelivery = jest.fn(
      (email: string) => ({ isValid: true })
    );

    // 呼び出し先の処理 buildNotificationContent をスタブ化
    // reporterName、reportContent、submissionTimestamp を受け取り、メール本文オブジェクトを返す
    mockBuildNotificationContent = jest.fn(
      (reporterName: string, reportContent: string, submissionTimestamp: string) => ({
        toAddress: 'leader@example.com',
        subject: `日報提出通知: ${reporterName}`,
        body: `報告者: ${reporterName}\n内容: ${reportContent}\n提出日時: ${submissionTimestamp}`,
      })
    );

    // 呼び出し先の処理 recordEmailSendingHistory をスタブ化
    // メール送信失敗時に null を返すように設定（送信履歴は記録されない）
    mockRecordEmailSendingHistory = jest.fn(
      () => null
    );

    // メール送信サービスの sendEmail メソッドがメール送信に失敗する状態を設定
    // sendEmail の戻り値を { success: false, error: 'SMTP connection timeout' } とする
    mockSendEmail = jest.fn(
      () => ({ success: false, error: 'SMTP connection timeout' })
    );
  });

  it('should return success=false with errorMessage when email sending fails', async () => {
    // 入力型 SendDailyReportSubmissionNotificationInput に以下の値を設定
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115',
      reportContent: '本日は顧客A社との打ち合わせを実施し、プロジェクト進捗について協議した',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    // sendDailyReportSubmissionNotification を実行
    const result: SendDailyReportSubmissionNotificationOutput =
      await sendDailyReportSubmissionNotification(input);

    // 戻り値の型 SendDailyReportSubmissionNotificationOutput を検証
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知します。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
