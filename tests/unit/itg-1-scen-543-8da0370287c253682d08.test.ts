import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendNonSubmissionPromptNotificationInput,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

// メール送信サービスのモック
jest.mock('../../src/services/email-service', () => ({
  sendEmail: jest.fn(),
}));

describe('SCEN-543: 送信処理の実行日時がISO 8601形式で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendNonSubmissionPromptNotification関数の戻り値のsentAtフィールドがISO 8601形式で返却される', async () => {
    // テスト用入力値を構成
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    // validateEmailAddressForDelivery、buildNotificationContent、recordEmailSendingHistoryをスタブ化
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue({
      isValid: true,
      reason: null,
    });

    jest.mocked(buildNotificationContent).mockResolvedValue({
      subject: '日報提出のお願い',
      body: '日報提出をお願いします。',
    });

    jest
      .mocked(recordEmailSendingHistory)
      .mockResolvedValueOnce({ historyId: 'hist-001' })
      .mockResolvedValueOnce({ historyId: 'hist-002' })
      .mockResolvedValueOnce({ historyId: 'hist-003' });

    // メール送信成功を模擬
    const { sendEmail } = require('../../src/services/email-service');
    sendEmail
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });

    // sendNonSubmissionPromptNotification関数を構成した入力値で呼び出す
    const result: SendNonSubmissionPromptNotificationOutput =
      await sendNonSubmissionPromptNotification(input);

    // 返却されたSendNonSubmissionPromptNotificationOutput.sentAtフィールドの値を取得
    const sentAt = result.sentAt;

    // sentAtの値がISO 8601形式（例：2025-01-15T14:30:45.123Z）であることを検証
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(iso8601Regex.test(sentAt)).toBe(true);

    // sentAtの値がUTC基準の完全な日時タイムスタンプ（年-月-日T時:分:秒.ミリ秒Z）で構成されていることを確認
    // sentAt が有効なISO 8601形式の日時文字列であることを検証
    expect(() => {
      const date = new Date(sentAt);
      // 日付が有効か確認（Invalid Dateではないか）
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    }).not.toThrow();

    // sentAt が UTC 基準で正しく解析できることを確認
    const parsedDate = new Date(sentAt);
    const isoString = parsedDate.toISOString();
    expect(isoString).toMatch(iso8601Regex);
  });
});
