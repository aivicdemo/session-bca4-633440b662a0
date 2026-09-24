import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendNonSubmissionPromptNotificationInput,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-531: 複数の未提出者に催促メールを一括送信して、全件成功時に成功フラグと履歴IDを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の未提出者に催促メールを一括送信し、全件成功時に成功フラグと履歴IDを返す', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'user001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'user002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
        { userId: 'user003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    jest.mocked(buildNotificationContent).mockResolvedValue({
      subject: '日報提出催促',
      body: '日報の提出をお願いします。',
    });

    const historyIds = ['history-001', 'history-002', 'history-003'];
    let callCount = 0;
    jest.mocked(recordEmailSendingHistory).mockImplementation(async () => {
      return {
        emailSendingHistoryId: historyIds[callCount++],
      };
    });

    const result: SendNonSubmissionPromptNotificationOutput =
      await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toEqual(['history-001', 'history-002', 'history-003']);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();

    expect(recordEmailSendingHistory).toHaveBeenCalledTimes(3);
  });
});
