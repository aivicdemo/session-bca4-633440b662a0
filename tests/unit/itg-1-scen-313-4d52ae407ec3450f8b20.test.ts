import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  SendLeaderNonSubmissionPromptNotificationInput,
  LeaderNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';
import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-313: LeaderNotFoundError when specified leader does not exist or lacks leader role', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderNotFoundError with message "Leader not found or does not have leader role." when leader does not exist', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'non-existent-leader',
      targetDate: '2024-01-15',
      nonSubmittedReporterIds: ['reporter-001'],
      reminderSettingId: 'setting-001',
      executionTimestamp: '2024-01-15T09:00:00Z',
    };

    const mockError = new LeaderNotFoundError('Leader not found or does not have leader role.');

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockImplementationOnce(async () => {
      throw mockError;
    });

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(LeaderNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('Leader not found or does not have leader role.');
  });
});
