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

describe('SCEN-544: totalTargetsが催促対象者リストの件数と一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('催促対象者が3件の場合、totalTargetsが3と等しい', async () => {
    // 催促対象者リストを構築する
    const nonSubmittedReporters = [
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
    ];

    // リーダー情報を用意する
    const leaderUserId = 'L001';
    const leaderEmailAddress = 'leader@example.com';

    // 催促メール送信処理の入力パラメータを準備する
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters,
      leaderUserId,
      leaderEmailAddress,
      detectionLogId: 'LOG-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    // スタブ設定
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

    const { sendEmail } = require('../../src/services/email-service');
    sendEmail
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });

    // sendNonSubmissionPromptNotification を呼び出す
    const result: SendNonSubmissionPromptNotificationOutput =
      await sendNonSubmissionPromptNotification(input);

    // 返却されたSendNonSubmissionPromptNotificationOutput の totalTargets フィールドの値を確認
    // totalTargets が 3 と等しいことを確認
    expect(result.totalTargets).toBe(3);

    // totalTargets が催促対象者リスト nonSubmittedReporters の件数（3件）と一致することを確認
    expect(result.totalTargets).toBe(nonSubmittedReporters.length);
  });
});
