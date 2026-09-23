import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  AllEmailSendingFailureError,
  SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-536: AllEmailSendingFailureError when all emails fail', () => {
  it('should throw AllEmailSendingFailureError when all target reporters fail', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user-002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user-003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'detection-log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    expect(() => sendNonSubmissionPromptNotification(input)).toThrow(
      AllEmailSendingFailureError
    );

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof AllEmailSendingFailureError) {
        expect(error.message).toBe('全ての催促メール送信に失敗しました。');
      }
    }
  });
});
