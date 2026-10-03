import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-548: 定時リマインダー時刻に到達したとき、リーダーへメール通知が送信される', () => {
  it('定時リマインダー時刻（17:00）に到達したとき、リーダーへメール通知が送信され、送信履歴が記録される', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T17:00:00.000Z'));

    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@company.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@company.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(result.sentAt).toBeDefined();
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();

    jest.useRealTimers();
  });
});
