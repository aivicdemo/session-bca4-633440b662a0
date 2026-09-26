import { describe, it, expect } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-539: メール送信失敗時でも、成功・失敗を問わず全ての送信履歴が記録される', () => {
  it('3件中1件成功2件失敗の場合、全3件の履歴が記録されること', async () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'user1', userName: 'ユーザー1', userEmailAddress: 'user1@example.com', targetDate: '2024-01-15' },
        { userId: 'user2', userName: 'ユーザー2', userEmailAddress: 'user2@example.com', targetDate: '2024-01-15' },
        { userId: 'user3', userName: 'ユーザー3', userEmailAddress: 'user3@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(false);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(2);
    expect(result.emailSendingHistoryIds).toHaveLength(3);
    expect(result.failedReporterIds).toBeTruthy();
    expect(result.failedReporterIds).toHaveLength(2);
    expect(result.errorMessage).toBeTruthy();
    expect(result.errorMessage).toContain('一部の催促メール送信に失敗しました。成功件数: 1, 失敗件数: 2。');
    expect(result.sentAt).toBeTruthy();
  });
});
