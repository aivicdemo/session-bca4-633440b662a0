import { describe, it, expect } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  AllEmailSendingFailureError,
} from '../../src/logic/email-notification-management';

describe('SCEN-536: 全ての未提出者へのメール送信に失敗したとき、AllEmailSendingFailureErrorが発生する', () => {
  it('should throw AllEmailSendingFailureError when all email sending fails', async () => {
    const nonSubmittedReporters = [
      {
        userId: 'U001',
        userName: '報告者1',
        userEmailAddress: 'user1@example.com',
        targetDate: '2024-01-15',
      },
      {
        userId: 'U002',
        userName: '報告者2',
        userEmailAddress: 'user2@example.com',
        targetDate: '2024-01-15',
      },
      {
        userId: 'U003',
        userName: '報告者3',
        userEmailAddress: 'user3@example.com',
        targetDate: '2024-01-15',
      },
    ];

    const input = {
      nonSubmittedReporters,
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'detection-log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
  });
});
