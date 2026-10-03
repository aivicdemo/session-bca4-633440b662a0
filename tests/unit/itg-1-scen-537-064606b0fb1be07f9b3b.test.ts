import { describe, it, expect } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  EmailServiceUnavailableError,
} from '../../src/logic/email-notification-management';

describe('SCEN-537: メール送信サービスが利用不可のとき、EmailServiceUnavailableErrorが発生する', () => {
  it('should throw EmailServiceUnavailableError when email service is unavailable', async () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(1);
    expect(result.successCount).toBe(1);
  });
});
