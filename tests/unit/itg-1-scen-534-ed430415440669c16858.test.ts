import { describe, it, expect } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-534: リーダーのメールアドレスが空のとき、InvalidLeaderEmailErrorが発生する', () => {
  const testCases = [
    { leaderEmailAddress: '', description: '空文字列' },
    { leaderEmailAddress: null, description: 'null' },
  ];

  testCases.forEach(({ leaderEmailAddress, description }) => {
    it(`leaderEmailAddress が ${description} のとき、InvalidLeaderEmailError が発生すること`, async () => {
      const input: SendNonSubmissionPromptNotificationInput = {
        nonSubmittedReporters: [
          { userId: 'user001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        ],
        leaderUserId: 'leader-001',
        leaderEmailAddress: leaderEmailAddress as any,
        detectionLogId: 'log-001',
        promptReason: '定時リマインダー',
        targetDate: '2024-01-15',
      };

      await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('リーダーのメールアドレスが無効です。');
    });
  });
});
