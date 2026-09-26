
import {
  sendLeaderNonSubmissionPromptNotification,
  NonSubmittedReportersNotFoundError,
  SendLeaderNonSubmissionPromptNotificationInput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-314: NonSubmittedReportersNotFoundError when non-submitted reporter list is empty', () => {
  it('should throw NonSubmittedReportersNotFoundError with message "No non-submitted reporters found for the target date." when reporter list is empty', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: [],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(NonSubmittedReportersNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('No non-submitted reporters found for the target date.');
  });
});
