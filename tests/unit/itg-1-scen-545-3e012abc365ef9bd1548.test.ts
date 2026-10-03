import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-545: successCount がメール送信に成功した対象者の数と一致する', () => {
  it('3件の未提出者に対してメール送信が成功した場合、successCountが3と一致する', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'user-001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'user-002', userName: '山田花子', userEmailAddress: 'yamada@example.com', targetDate: '2024-01-15' },
        { userId: 'user-003', userName: '鈴木次郎', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-12345',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.successCount).toBe(3);
    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.sentAt).toBeDefined();
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.emailSendingHistoryIds).toHaveLength(3);
  });
});
