import { jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  InvalidLeaderEmailError,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-533: リーダーのメールアドレスが無効な形式のとき、InvalidLeaderEmailErrorが発生する', () => {
  it('should throw InvalidLeaderEmailError when leaderEmailAddress is empty string', async () => {
    // 有効な未提出者リスト（複数件）
    const nonSubmittedReporters = [
      {
        userId: 'user001',
        userName: '田中太郎',
        userEmailAddress: 'tanaka@example.com',
        targetDate: '2024-01-15',
      },
      {
        userId: 'user002',
        userName: '鈴木花子',
        userEmailAddress: 'suzuki@example.com',
        targetDate: '2024-01-15',
      },
    ];

    const leaderUserId = 'leader001';
    const leaderEmailAddress = ''; // 無効な形式（空文字列）
    const detectionLogId = 'log-20240115-001';
    const promptReason = '定時リマインダー';
    const targetDate = '2024-01-15';

    // sendNonSubmissionPromptNotification を実行
    await expect(
      sendNonSubmissionPromptNotification({
        nonSubmittedReporters,
        leaderUserId,
        leaderEmailAddress,
        detectionLogId,
        promptReason,
        targetDate,
      })
    ).rejects.toThrow(InvalidLeaderEmailError);

    // エラーメッセージが「リーダーのメールアドレスが無効です。」であることを検証
    await expect(
      sendNonSubmissionPromptNotification({
        nonSubmittedReporters,
        leaderUserId,
        leaderEmailAddress,
        detectionLogId,
        promptReason,
        targetDate,
      })
    ).rejects.toThrow('リーダーのメールアドレスが無効です。');
  });

  it('should throw InvalidLeaderEmailError when leaderEmailAddress is null', async () => {
    // 有効な未提出者リスト（複数件）
    const nonSubmittedReporters = [
      {
        userId: 'user001',
        userName: '田中太郎',
        userEmailAddress: 'tanaka@example.com',
        targetDate: '2024-01-15',
      },
    ];

    const leaderUserId = 'leader001';
    const leaderEmailAddress = null; // 無効な形式（null）
    const detectionLogId = 'log-20240115-001';
    const promptReason = '定時リマインダー';
    const targetDate = '2024-01-15';

    // sendNonSubmissionPromptNotification を実行
    await expect(
      sendNonSubmissionPromptNotification({
        nonSubmittedReporters,
        leaderUserId,
        leaderEmailAddress: leaderEmailAddress as any,
        detectionLogId,
        promptReason,
        targetDate,
      })
    ).rejects.toThrow(InvalidLeaderEmailError);

    // エラーメッセージが「リーダーのメールアドレスが無効です。」であることを検証
    await expect(
      sendNonSubmissionPromptNotification({
        nonSubmittedReporters,
        leaderUserId,
        leaderEmailAddress: leaderEmailAddress as any,
        detectionLogId,
        promptReason,
        targetDate,
      })
    ).rejects.toThrow('リーダーのメールアドレスが無効です。');
  });

  it('should not call validateEmailAddressForDelivery, buildNotificationContent, or recordEmailSendingHistory when InvalidLeaderEmailError is thrown', async () => {
    // 有効な未提出者リスト
    const nonSubmittedReporters = [
      {
        userId: 'user001',
        userName: '田中太郎',
        userEmailAddress: 'tanaka@example.com',
        targetDate: '2024-01-15',
      },
    ];

    const leaderUserId = 'leader001';
    const leaderEmailAddress = ''; // 無効なメールアドレス
    const detectionLogId = 'log-20240115-001';
    const promptReason = '定時リマインダー';
    const targetDate = '2024-01-15';

    // モック関数を作成
    const validateEmailAddressForDeliveryMock = jest.fn();
    const buildNotificationContentMock = jest.fn();
    const recordEmailSendingHistoryMock = jest.fn();

    // sendNonSubmissionPromptNotification を実行
    try {
      await sendNonSubmissionPromptNotification(
        {
          nonSubmittedReporters,
          leaderUserId,
          leaderEmailAddress,
          detectionLogId,
          promptReason,
          targetDate,
        },
        {
          validateEmailAddressForDelivery: validateEmailAddressForDeliveryMock,
          buildNotificationContent: buildNotificationContentMock,
          recordEmailSendingHistory: recordEmailSendingHistoryMock,
        }
      );
    } catch (error: any) {
      if (error instanceof InvalidLeaderEmailError) {
        // 検証：依存先の関数が呼び出されないこと
        expect(validateEmailAddressForDeliveryMock).not.toHaveBeenCalled();
        expect(buildNotificationContentMock).not.toHaveBeenCalled();
        expect(recordEmailSendingHistoryMock).not.toHaveBeenCalled();
      } else {
        throw error;
      }
    }
  });
});
