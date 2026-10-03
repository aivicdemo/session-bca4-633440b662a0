import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

describe('SCEN-542: メール送信に失敗が発生したとき、failedReporterIdsに失敗した対象者のユーザーIDが返される', () => {
  it('催促対象者3名に対して処理を実行する', async () => {
    const nonSubmittedReporters = [
      { userId: 'user1', userName: '太郎', userEmailAddress: 'user1@example.com', targetDate: '2024-01-15' },
      { userId: 'user2', userName: '花子', userEmailAddress: 'user2@example.com', targetDate: '2024-01-15' },
      { userId: 'user3', userName: '次郎', userEmailAddress: 'user3@example.com', targetDate: '2024-01-15' },
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
