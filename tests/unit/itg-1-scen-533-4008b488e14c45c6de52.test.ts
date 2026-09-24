import { describe, it, expect } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  InvalidLeaderEmailError,
  type SendNonSubmissionPromptNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-533: リーダーのメールアドレスが無効な形式のとき、InvalidLeaderEmailErrorが発生する', () => {
  it('leaderEmailAddressが空文字列の場合、InvalidLeaderEmailErrorが発生する', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader001',
      leaderEmailAddress: '',
      detectionLogId: 'log-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    expect(() => {
      sendNonSubmissionPromptNotification(input);
    }).toThrow(InvalidLeaderEmailError);

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof InvalidLeaderEmailError) {
        expect(error.message).toBe('リーダーのメールアドレスが無効です。');
      }
    }
  });

  it('leaderEmailAddressが無効な形式の場合、InvalidLeaderEmailErrorが発生する', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader001',
      leaderEmailAddress: 'invalid-email-format',
      detectionLogId: 'log-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    expect(() => {
      sendNonSubmissionPromptNotification(input);
    }).toThrow(InvalidLeaderEmailError);

    try {
      sendNonSubmissionPromptNotification(input);
    } catch (error) {
      if (error instanceof InvalidLeaderEmailError) {
        expect(error.message).toBe('リーダーのメールアドレスが無効です。');
      }
    }
  });
});
