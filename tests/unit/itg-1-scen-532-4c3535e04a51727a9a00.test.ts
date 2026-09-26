import { describe, it, expect } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-532: 催促対象者リストが空またはnullのとき、InvalidPromptTargetListErrorが発生する', () => {
  it('nonSubmittedReporters に空配列 [] を渡したときエラーが発生すること', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('催促対象者リストが空です。');
  });
});
