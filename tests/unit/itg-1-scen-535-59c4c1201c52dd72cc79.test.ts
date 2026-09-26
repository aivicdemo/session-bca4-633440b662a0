import { describe, it, expect } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-535: 複数の未提出者のうち一部へのメール送信に失敗したとき、PartialEmailSendingFailureErrorが発生する', () => {
  it('2件中1件の送信に失敗したときエラーメッセージに成功件数と失敗件数が含まれること', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'U002', userName: '佐藤花子', userEmailAddress: 'satoh@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('一部の催促メール送信に失敗しました。成功件数: 1, 失敗件数: 1。');
  });
});
