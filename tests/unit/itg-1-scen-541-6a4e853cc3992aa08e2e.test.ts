import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

describe('SCEN-541: 全件成功時、errorMessageがnullで返される', () => {
  it('全ての催促メール送信が成功した場合、errorMessageはnullで返される', async () => {
    const nonSubmittedReporters = [
      { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2025-01-15' },
      { userId: 'U002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2025-01-15' },
      { userId: 'U003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2025-01-15' },
    ];

    const result = await sendNonSubmissionPromptNotification({
      nonSubmittedReporters,
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'DL-2025-01-15-001',
      promptReason: '定時リマインダー',
      targetDate: '2025-01-15',
    });

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds.length).toBe(3);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
