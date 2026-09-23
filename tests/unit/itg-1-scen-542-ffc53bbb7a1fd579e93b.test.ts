import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  PartialEmailSendingFailureError,
  SendNonSubmissionPromptNotificationInput,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

// メール送信サービスのモック
jest.mock('../../src/services/email-service', () => ({
  sendEmail: jest.fn(),
}));

describe('SCEN-542: メール送信に失敗が発生したとき、failedReporterIdsに失敗した対象者のユーザーIDが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の催促対象者のうち一部のメール送信に失敗した場合、failedReporterIdsに失敗した対象者IDが返される', async () => {
    // テスト前提：複数の催促対象者を含む入力値を構築
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user1',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user2',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user3',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    // validateEmailAddressForDelivery をスタブ化し、leaderEmailAddress に対して成功を返す
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue({
      isValid: true,
      reason: null,
    });

    // buildNotificationContent をスタブ化し、各対象者に対して正常なメール本文を返す
    jest.mocked(buildNotificationContent).mockResolvedValue({
      subject: '日報提出のお願い',
      body: '日報提出をお願いします。',
    });

    // recordEmailSendingHistory をスタブ化し、最初の2件は成功時の履歴ID、3件目は例外を返す
    jest
      .mocked(recordEmailSendingHistory)
      .mockResolvedValueOnce({ historyId: 'hist-001' })
      .mockResolvedValueOnce({ historyId: 'hist-002' })
      .mockRejectedValueOnce(new Error('Failed to record history'));

    // メール送信サービスの呼び出しをスタブ化し、user1 と user2 に対しては成功を返し、user3 に対してのみ失敗を返す
    const { sendEmail } = require('../../src/services/email-service');
    sendEmail
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('Email delivery failed'));

    // sendNonSubmissionPromptNotification 関数を呼び出す
    const result: SendNonSubmissionPromptNotificationOutput =
      await sendNonSubmissionPromptNotification(input);

    // 戻り値の出力型 SendNonSubmissionPromptNotificationOutput を検証
    // success フィールドが false（全件成功ではない）であることを確認
    expect(result.success).toBe(false);

    // totalTargets フィールドが 3 であることを確認
    expect(result.totalTargets).toBe(3);

    // successCount フィールドが 2 であることを確認
    expect(result.successCount).toBe(2);

    // failureCount フィールドが 1 であることを確認
    expect(result.failureCount).toBe(1);

    // emailSendingHistoryIds フィールドが3件の履歴ID（成功2件+失敗1件）を含む配列であることを確認
    expect(result.emailSendingHistoryIds).toEqual(['hist-001', 'hist-002']);
    expect(result.emailSendingHistoryIds.length).toBeLessThanOrEqual(3);

    // sentAt フィールドが ISO 8601形式の日時文字列であることを確認
    expect(typeof result.sentAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.sentAt)).toBe(
      true
    );

    // failedReporterIds フィールドが null ではなく、配列 ['user3'] を含むことを確認
    expect(result.failedReporterIds).not.toBeNull();
    expect(result.failedReporterIds).toEqual(['user3']);

    // errorMessage フィールドが null ではなく、PartialEmailSendingFailureError の文言を含むことを確認
    expect(result.errorMessage).not.toBeNull();
    expect(result.errorMessage).toContain('一部の催促メール送信に失敗しました');
    expect(result.errorMessage).toContain('成功件数: 2');
    expect(result.errorMessage).toContain('失敗件数: 1');
  });
});
