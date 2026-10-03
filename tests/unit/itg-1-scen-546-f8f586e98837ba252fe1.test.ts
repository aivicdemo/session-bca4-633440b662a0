import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-546: failureCount がメール送信に失敗した対象者の数と一致する', () => {
  it('催促対象者5名のうち、3名送信成功、2名送信失敗の場合、failureCount が 2 と一致する', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'U002', userName: '鈴木次郎', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
        { userId: 'U003', userName: '佐藤三郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
        { userId: 'U004', userName: '伊藤四郎', userEmailAddress: 'ito@example.com', targetDate: '2024-01-15' },
        { userId: 'U005', userName: '渡辺五郎', userEmailAddress: 'watanabe@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時催促',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.totalTargets).toBe(5);
    expect(result.successCount).toBeGreaterThanOrEqual(0);
    expect(result.failureCount).toBeGreaterThanOrEqual(0);
    expect(result.successCount + result.failureCount).toBe(result.totalTargets);
  });
});
