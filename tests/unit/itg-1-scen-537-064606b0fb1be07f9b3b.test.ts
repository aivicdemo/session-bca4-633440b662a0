import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  EmailServiceUnavailableError,
  SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-537: EmailServiceUnavailableError when email service is unavailable', () => {
  it('should throw EmailServiceUnavailableError with correct message', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
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

    expect(() => sendNonSubmissionPromptNotification(input)).toThrow(
      EmailServiceUnavailableError
    );

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof EmailServiceUnavailableError) {
        expect(error.message).toBe('メール送信サービスが一時的に利用不可です。');
      }
    }
  });
});
