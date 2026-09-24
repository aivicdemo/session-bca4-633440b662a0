jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/notification-persistence');

import {
  sendLeaderNonSubmissionPromptNotification,
  NonSubmittedReportersNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-314: NonSubmittedReportersNotFoundError when non-submitted reporter list is empty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NonSubmittedReportersNotFoundError with message "No non-submitted reporters found for the target date." when reporter list is empty', async () => {
    const input = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: [] as string[],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(NonSubmittedReportersNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('No non-submitted reporters found for the target date.');
  });
});
