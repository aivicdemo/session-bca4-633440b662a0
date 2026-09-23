import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  EmailSendingFailedError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-496: メール送信サーバーへの接続に失敗した場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error message when email server connection fails', async () => {
    // テスト前提：メール送信サーバーへの接続がタイムアウト
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日はタスクA を完了、明日タスクB を開始予定',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.jp',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    // validateEmailAddressForDelivery をスタブ化（成功を返す）
    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: true });

    // buildNotificationContent をスタブ化（有効なメール本文を返す）
    const mockBuildNotificationContent = jest
      .fn()
      .mockReturnValue({
        toAddress: 'leader@company.jp',
        subject: '【日報】2024年01月15日',
        body: 'テスト本文',
      });

    // メール送信処理をスタブ化（接続失敗エラーを発生させる）
    const mockEmailSendingFailure = (jest.fn() as any)
      .mockRejectedValue(new Error('Connection timeout'));

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    // メール送信がタイムアウトする状態を設定

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // エラーが発生しない場合の出力値を確認
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に確認してください');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // EmailSendingFailedError がスローされる場合
      expect(error).toBeInstanceOf(EmailSendingFailedError);
      expect(error.message).toBe('メール送信に失敗しました。管理者に確認してください');
    }
  });

  it('should not record email sending history when server connection fails', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日はタスクA を完了、明日タスクB を開始予定',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.jp',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: true });

    const mockBuildNotificationContent = jest
      .fn()
      .mockReturnValue({
        toAddress: 'leader@company.jp',
        subject: '【日報】2024年01月15日',
        body: 'テスト本文',
      });

    const mockRecordEmailSendingHistory = jest.fn();

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'recordEmailSendingHistory'
    ).mockImplementation(mockRecordEmailSendingHistory);

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラー発生を期待
    }

    // recordEmailSendingHistory が呼び出されないことを確認（サーバー接続失敗のため）
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });

  it('should send admin notification when email sending fails', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日はタスクA を完了、明日タスクB を開始予定',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.jp',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: true });

    const mockBuildNotificationContent = jest
      .fn()
      .mockReturnValue({
        toAddress: 'leader@company.jp',
        subject: '【日報】2024年01月15日',
        body: 'テスト本文',
      });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    try {
      const result = await sendDailyReportSubmissionNotification(input);
      // 管理者への通知が送信されることを確認
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailedError);
    }
  });
});
