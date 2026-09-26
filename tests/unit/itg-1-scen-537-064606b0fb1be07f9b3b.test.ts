import { describe, it, expect } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-537: メール送信サービスが利用不可のとき、EmailServiceUnavailableErrorが発生する', () => {
  it('メール送信サービスが利用不可のときEmailServiceUnavailableErrorが発生すること', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('メール送信サービスが一時的に利用不可です。');
  });
});
