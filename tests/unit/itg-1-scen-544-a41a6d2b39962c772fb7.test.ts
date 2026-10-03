import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

describe('SCEN-544: totalTargetsが催促対象者リストの件数と一致する', () => {
  it('totalTargetsが催促対象者リストの件数と一致する', async () => {
    const nonSubmittedReporters = [
      { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
      { userId: 'U002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
      { userId: 'U003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
    ];

    const result = await sendNonSubmissionPromptNotification({
      nonSubmittedReporters,
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    });

    expect(result.totalTargets).toBe(3);
    expect(result.totalTargets).toBe(nonSubmittedReporters.length);
  });
});
