import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-547: emailSendingHistoryIds の件数が成功件数と失敗件数の合計と一致する', () => {
  it('emailSendingHistoryIds の件数が successCount と failureCount の合計と一致すること', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'user-001', userName: '報告者1', userEmailAddress: 'reporter1@example.com', targetDate: '2024-01-15' },
        { userId: 'user-002', userName: '報告者2', userEmailAddress: 'reporter2@example.com', targetDate: '2024-01-15' },
        { userId: 'user-003', userName: '報告者3', userEmailAddress: 'reporter3@example.com', targetDate: '2024-01-15' },
        { userId: 'user-004', userName: '報告者4', userEmailAddress: 'reporter4@example.com', targetDate: '2024-01-15' },
        { userId: 'user-005', userName: '報告者5', userEmailAddress: 'reporter5@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-12345',
      promptReason: '手動催促',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.emailSendingHistoryIds.length).toBe(5);
    expect(result.successCount + result.failureCount).toBe(result.emailSendingHistoryIds.length);
  });
});
