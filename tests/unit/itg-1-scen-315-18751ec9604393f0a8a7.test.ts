jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/notification-persistence');

import {
  sendLeaderNonSubmissionPromptNotification,
  ReminderSettingNotConfiguredError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-315: ReminderSettingNotConfiguredError when reminder settings are not configured or disabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReminderSettingNotConfiguredError with message "Reminder notification settings not configured or disabled for leader." when settings are not configured', async () => {
    const input = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'reminder-setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(ReminderSettingNotConfiguredError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(
      'Reminder notification settings not configured or disabled for leader.'
    );
  });
});
