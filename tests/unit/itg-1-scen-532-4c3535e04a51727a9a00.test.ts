import { sendNonSubmissionPromptNotification, InvalidPromptTargetListError } from '../../src/logic/email-notification-management';

describe('SCEN-532: 催促対象者リストが空またはnullのとき、InvalidPromptTargetListErrorが発生する', () => {
  it('should throw InvalidPromptTargetListError when nonSubmittedReporters is empty', async () => {
    const input = {
      nonSubmittedReporters: [],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow(InvalidPromptTargetListError);
    await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow('催促対象者リストが空です。');
  });
});
