import { describe, it, expect } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
} from '../../src/logic/email-notification-management';

describe('SCEN-538: メール送信成功時、全ての催促対象者の送信履歴が記録される', () => {
  it('should record sending history for all three reporters when all emails succeed', async () => {
    const nonSubmittedReporters = [
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
      {
        userId: 'user003',
        userName: '佐藤次郎',
        userEmailAddress: 'sato@example.com',
        targetDate: '2024-01-15',
      },
    ];

    const input = {
      nonSubmittedReporters,
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toHaveLength(3);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
