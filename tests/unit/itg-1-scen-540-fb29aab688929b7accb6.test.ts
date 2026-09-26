import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import { sendNonSubmissionPromptNotification, type SendNonSubmissionPromptNotificationInput, type SendNonSubmissionPromptNotificationOutput } from '../../src/logic/email-notification-management';
import { validateEmailAddressForDelivery, buildNotificationContent, recordEmailSendingHistory } from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
const mockedBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;

describe('SCEN-540: 全件成功時、failedReporterIdsがnullで返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // validateEmailAddressForDelivery をスタブ化し、全ての対象者メールアドレスと leaderEmailAddress の検証が成功（true）を返すよう設定
    mockedValidateEmailAddressForDelivery.mockImplementation(() =>
      Promise.resolve({
        isValid: true,
        reason: null,
        errorCode: null,
      })
    );

    // buildNotificationContent をスタブ化し、全ての対象者に対して有効なメール本文を返すよう設定
    mockedBuildNotificationContent.mockImplementation(() =>
      Promise.resolve({
        subject: '日報の提出をお願いします',
        body: 'お忙しいところ恐れ入りますが、日報の提出をお願いいたします。',
      })
    );

    // recordEmailSendingHistory をスタブ化し、呼び出しの度に一意の履歴ID を返すよう設定
    mockedRecordEmailSendingHistory
      .mockResolvedValueOnce({ success: true, emailSendingHistoryId: 'history-001', recordedAt: '2024-01-15T09:00:00Z', errorMessage: null })
      .mockResolvedValueOnce({ success: true, emailSendingHistoryId: 'history-002', recordedAt: '2024-01-15T09:00:01Z', errorMessage: null })
      .mockResolvedValueOnce({ success: true, emailSendingHistoryId: 'history-003', recordedAt: '2024-01-15T09:00:02Z', errorMessage: null });
  });

  it('全ての催促対象者へのメール送信が成功し、失敗者が存在しないため failedReporterIds は null で返される', async () => {
    // 未提出者検知処理から受け取った催促対象者リストを準備する: nonSubmittedReporters に3件の未提出者情報（userId, userName, userEmailAddress, targetDate）を格納
    const nonSubmittedReporters = [
      { userId: 'user001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
      { userId: 'user002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
      { userId: 'user003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
    ];

    // チームリーダーの情報を準備する: leaderUserId, leaderEmailAddress（有効な形式）, detectionLogId, promptReason, targetDate を設定
    const leaderUserId = 'leader001';
    const leaderEmailAddress = 'leader@example.com';
    const detectionLogId = 'log-20240115-001';
    const promptReason = '定時リマインダー';
    const targetDate = '2024-01-15';

    // sendNonSubmissionPromptNotification を、準備した入力データで呼び出す
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters,
      leaderUserId,
      leaderEmailAddress,
      detectionLogId,
      promptReason,
      targetDate,
    };

    const result: SendNonSubmissionPromptNotificationOutput = await sendNonSubmissionPromptNotification(input);

    // 戻り値の出力型フィールドを検証する
    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toHaveLength(3);
    expect(result.emailSendingHistoryIds[0]).toBe('history-001');
    expect(result.emailSendingHistoryIds[1]).toBe('history-002');
    expect(result.emailSendingHistoryIds[2]).toBe('history-003');
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
