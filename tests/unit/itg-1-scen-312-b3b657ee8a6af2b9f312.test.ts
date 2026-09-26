import {
  sendLeaderNonSubmissionPromptNotification,
  SendLeaderNonSubmissionPromptNotificationInput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-312: Send non-submission prompt notification successfully when all conditions are met', () => {
  it('should return success output with notificationId and email delivery method when all conditions are met', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2025-01-15T10:30:00Z'),
    };

    const result = await sendLeaderNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.notificationId).not.toBeNull();
    expect(typeof result.notificationId).toBe('string');
    expect(result.sentAt).not.toBeNull();
    expect(result.sentAt instanceof Date).toBe(true);
    expect(result.deliveryMethod).toBe('email');
    expect(result.nonSubmittedReporterCount).toBe(2);
    expect(result.errorDetails).toBeNull();
  });
});
