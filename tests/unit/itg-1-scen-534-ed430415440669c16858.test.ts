import { describe, it, expect, jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  InvalidLeaderEmailError,
  SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-534: InvalidLeaderEmailError when leader email is empty', () => {
  it('should throw InvalidLeaderEmailError with appropriate message when leaderEmailAddress is empty string', () => {
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
      leaderEmailAddress: '',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    expect(() => sendNonSubmissionPromptNotification(input)).toThrow(
      InvalidLeaderEmailError
    );

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof InvalidLeaderEmailError) {
        expect(error.message).toBe('リーダーのメールアドレスが無効です。');
      }
    }
  });

  it('should throw InvalidLeaderEmailError with appropriate message when leaderEmailAddress is null', () => {
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
      leaderEmailAddress: null as any,
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    expect(() => sendNonSubmissionPromptNotification(input)).toThrow(
      InvalidLeaderEmailError
    );

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof InvalidLeaderEmailError) {
        expect(error.message).toBe('リーダーのメールアドレスが無効です。');
      }
    }
  });
});
