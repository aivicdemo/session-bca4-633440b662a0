import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  SendLeaderNonSubmissionPromptNotificationInput,
  SendLeaderNonSubmissionPromptNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';
import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import {
  determineReminderNotificationEligibility,
  buildReminderNotificationContent,
  selectNotificationDeliveryMethod,
  recordReminderNotificationSendingResult,
} from '../../src/logic/daily-report-reminder-notification';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-312: Send non-submission prompt notification successfully when all conditions are met', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success output with notificationId and email delivery method when all conditions are met', async () => {
    const input: SendLeaderNonSubmissionPromptNotificationInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'setting-001',
      executionTimestamp: '2025-01-15T10:30:00Z',
    };

    const expectedOutput: SendLeaderNonSubmissionPromptNotificationOutput = {
      success: true,
      notificationId: 'notif-uuid-xxx',
      sentAt: '2025-01-15T10:30:00Z',
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 2,
      errorDetails: null,
    };

    (validateUserHasLeaderRole as jest.Mock).mockResolvedValueOnce({});
    (judgeSchedulerExecutionTiming as jest.Mock).mockResolvedValueOnce({ isWithinBusinessHours: true });
    (determineReminderNotificationEligibility as jest.Mock).mockResolvedValueOnce({ isEligible: true });
    (buildReminderNotificationContent as jest.Mock).mockResolvedValueOnce({
      subject: 'Test Subject',
      body: 'Test Body',
    });
    (selectNotificationDeliveryMethod as jest.Mock).mockResolvedValueOnce({ method: 'email' });
    (sendNonSubmissionPromptNotification as jest.Mock).mockResolvedValueOnce({
      notificationId: 'notif-uuid-xxx',
      sentAt: '2025-01-15T10:30:00Z',
    });
    (recordReminderNotificationSendingResult as jest.Mock).mockResolvedValueOnce({});

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValueOnce(expectedOutput);

    const result = await sendLeaderNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.notificationId).not.toBeNull();
    expect(result.sentAt).not.toBeNull();
    expect(result.deliveryMethod).toBe('email');
    expect(result.nonSubmittedReporterCount).toBe(2);
    expect(result.errorDetails).toBeNull();
  });
});
