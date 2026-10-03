import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

describe('SCEN-539: メール送信失敗時でも、成功・失敗を問わず全ての送信履歴が記録される', () => {
  it('催促対象者3名に対して処理を実行し、全ての送信履歴が記録される', async () => {
    const nonSubmittedReporters = [
      { userId: 'user1', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
      { userId: 'user2', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
      { userId: 'user3', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
    ];

    const result = await sendNonSubmissionPromptNotification({
      nonSubmittedReporters,
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    });

    expect(result.totalTargets).toBe(3);
    expect(result.emailSendingHistoryIds).toHaveLength(3);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
