import { describe, it, expect } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  InvalidLeaderEmailError,
  type SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-534: リーダーのメールアドレスが空のとき、InvalidLeaderEmailErrorが発生する', () => {
  it('leaderEmailAddressが空文字列のとき、InvalidLeaderEmailErrorが発生し、エラーメッセージが「リーダーのメールアドレスが無効です。」である', () => {
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

  it('leaderEmailAddressがnullのとき、InvalidLeaderEmailErrorが発生し、エラーメッセージが「リーダーのメールアドレスが無効です。」である', () => {
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

  it('出力型の success は false、errorMessage フィールドに「リーダーのメールアドレスが無効です。」が格納される', () => {
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

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof InvalidLeaderEmailError) {
        expect(error.message).toBe('リーダーのメールアドレスが無効です。');
      }
    }
  });
});
