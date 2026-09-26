import { describe, it, expect } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-536: 全ての未提出者へのメール送信に失敗したとき、AllEmailSendingFailureErrorが発生する', () => {
  it('全3名への送信が全て失敗したときAllEmailSendingFailureErrorが発生すること', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'user001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'user002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
        { userId: 'user003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'detection-log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('全ての催促メール送信に失敗しました。');
  });
});
