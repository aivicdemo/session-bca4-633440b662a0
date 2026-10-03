import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  PartialEmailSendingFailureError,
} from '../../src/logic/email-notification-management';

describe('SCEN-535: 複数の未提出者のうち一部へのメール送信に失敗したとき、PartialEmailSendingFailureErrorが発生して成功件数と失敗件数が返される', () => {
  it('should throw PartialEmailSendingFailureError with 1 success and 1 failure', async () => {
    const nonSubmittedReporters = [
      {
        userId: 'U001',
        userName: '田中太郎',
        userEmailAddress: 'tanaka@example.com',
        targetDate: '2024-01-15',
      },
      {
        userId: 'U002',
        userName: '佐藤花子',
        userEmailAddress: 'satoh@example.com',
        targetDate: '2024-01-15',
      },
    ];

    const input = {
      nonSubmittedReporters,
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.totalTargets).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
  });
});
