import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  SendLeaderNonSubmissionPromptNotificationInput,
  ReminderSettingNotConfiguredError,
} from '../../src/logic/daily-report-reminder-notification';
import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-315: ReminderSettingNotConfiguredError when reminder settings are not configured or disabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReminderSettingNotConfiguredError with message "Reminder notification settings not configured or disabled for leader." when settings are not configured', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'reminder-setting-001',
      executionTimestamp: '2024-01-15T09:00:00Z',
    };

    const mockError = new ReminderSettingNotConfiguredError('Reminder notification settings not configured or disabled for leader.');

    (validateUserHasLeaderRole as jest.Mock).mockResolvedValueOnce({});
    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValueOnce({ isWithinBusinessHours: true });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockImplementationOnce(async () => {
      throw mockError;
    });

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(ReminderSettingNotConfiguredError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(
      'Reminder notification settings not configured or disabled for leader.'
    );
  });
});
