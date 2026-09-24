jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

import {
  sendLeaderNonSubmissionPromptNotification,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-312: Send non-submission prompt notification successfully when all conditions are met', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success output with notificationId and email delivery method when all conditions are met', async () => {
    const input = {
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2025-01-15T10:30:00Z'),
    };

    const result = await sendLeaderNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.notificationId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.deliveryMethod).toBe('email');
    expect(result.nonSubmittedReporterCount).toBe(2);
    expect(result.errorDetails).toBeNull();
  });
});
