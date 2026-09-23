import { jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  InvalidPromptTargetListError,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-531: 複数の未提出者に催促メールを一括送信して、全件成功時に成功フラグと履歴IDを返す', () => {
  it('should return success with all history IDs when sending prompt emails to 3 reporters successfully', async () => {
    // 未提出者リスト（3件）
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
      {
        userId: 'user003',
        userName: '佐藤次郎',
        userEmailAddress: 'sato@example.com',
        targetDate: '2024-01-15',
      },
    ];

    const leaderUserId = 'leader001';
    const leaderEmailAddress = 'leader@example.com';
    const detectionLogId = 'log-20240115-001';
    const promptReason = '定時リマインダー';
    const targetDate = '2024-01-15';

    // validateEmailAddressForDelivery をモック：全てのメールアドレスに true を返す
    const validateEmailAddressForDeliveryMock = jest
      .fn(validateEmailAddressForDelivery)
      .mockResolvedValue(true);

    // buildNotificationContent をモック：催促メール本文を返す
    const buildNotificationContentMock = jest
      .fn(buildNotificationContent)
      .mockResolvedValue({
        subject: '【催促】日報の提出をお願いします',
        body: '本日の日報提出がまだされていません。ご対応ください。',
      });

    // recordEmailSendingHistory をモック：順に履歴IDを返す
    const recordEmailSendingHistoryMock = jest
      .fn(recordEmailSendingHistory)
      .mockResolvedValueOnce({ historyId: 'history-001' })
      .mockResolvedValueOnce({ historyId: 'history-002' })
      .mockResolvedValueOnce({ historyId: 'history-003' });

    // テスト対象関数を実行
    const result = (await sendNonSubmissionPromptNotification(
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
    )) as SendNonSubmissionPromptNotificationOutput;

    // 検証：戻り値の出力型
    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toEqual([
      'history-001',
      'history-002',
      'history-003',
    ]);
    expect(result.sentAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();

    // 検証：recordEmailSendingHistory が3回呼び出されたことと引数
    expect(recordEmailSendingHistoryMock).toHaveBeenCalledTimes(3);
    // 1回目の呼び出しで user001 のメールアドレスを含む
    expect(recordEmailSendingHistoryMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 'user001',
        userEmailAddress: 'tanaka@example.com',
      }),
      expect.any(Object)
    );
    // 2回目の呼び出しで user002 のメールアドレスを含む
    expect(recordEmailSendingHistoryMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 'user002',
        userEmailAddress: 'suzuki@example.com',
      }),
      expect.any(Object)
    );
    // 3回目の呼び出しで user003 のメールアドレスを含む
    expect(recordEmailSendingHistoryMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        userId: 'user003',
        userEmailAddress: 'sato@example.com',
      }),
      expect.any(Object)
    );
  });
});
