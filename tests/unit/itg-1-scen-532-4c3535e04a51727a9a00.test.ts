import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  InvalidPromptTargetListError,
  SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-532: 催促対象者リストが空またはnullのとき、InvalidPromptTargetListErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('nonSubmittedReporters が空配列の場合、InvalidPromptTargetListError が発生する', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [],
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    jest.mocked(validateEmailAddressForDelivery).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    jest.mocked(buildNotificationContent).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    jest.mocked(recordEmailSendingHistory).mockImplementation(() => {
      throw new Error('Should not be called');
    });

    let thrownError: Error | undefined;
    try {
      await sendNonSubmissionPromptNotification(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeInstanceOf(InvalidPromptTargetListError);
    expect(thrownError?.message).toBe('催促対象者リストが空です。');
  });
});
