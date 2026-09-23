import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  SendLeaderNonSubmissionPromptNotificationInput,
  NonSubmittedReportersNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-314: NonSubmittedReportersNotFoundError when non-submitted reporter list is empty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NonSubmittedReportersNotFoundError with message "No non-submitted reporters found for the target date." when reporter list is empty', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
      nonSubmittedReporterIds: [],
      reminderSettingId: 'setting-001',
      executionTimestamp: '2024-01-15T09:00:00Z',
    };

    const mockError = new NonSubmittedReportersNotFoundError('No non-submitted reporters found for the target date.');

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockImplementationOnce(async () => {
      throw mockError;
    });

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(NonSubmittedReportersNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('No non-submitted reporters found for the target date.');
  });
});
