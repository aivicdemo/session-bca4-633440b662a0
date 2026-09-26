
import {
  sendLeaderNonSubmissionPromptNotification,
  LeaderNotFoundError,
  SendLeaderNonSubmissionPromptNotificationInput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-313: LeaderNotFoundError when specified leader does not exist or lacks leader role', () => {
  it('should throw LeaderNotFoundError with message "Leader not found or does not have leader role." when leader does not exist', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'non-existent-leader',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001'],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(LeaderNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('Leader not found or does not have leader role.');
  });
});
