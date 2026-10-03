import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-549: 報告者の日報内容が空またはホワイトスペースのみのとき、warn文言が記録される', () => {
  it('報告者の日報内容が空またはホワイトスペースのみのとき、warn文言が記録される', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'R001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toHaveLength(1);
    expect(result.sentAt).toBeDefined();
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();

    warnSpy.mockRestore();
  });
});
