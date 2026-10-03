import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserHasLeaderRole: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendNonSubmissionPromptNotification: jest.fn(),
}));

import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

import {
  sendLeaderNonSubmissionPromptNotification,
  type SendLeaderNonSubmissionPromptNotificationInput,
  type SendLeaderNonSubmissionPromptNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-312: Send non-submission prompt notification successfully when all conditions are met', () => {
  const mockInput: SendLeaderNonSubmissionPromptNotificationInput = {
    leaderId: 'leader-001',
    targetDate: new Date('2025-01-15'),
    nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
    reminderSettingId: 'setting-001',
    executionTimestamp: new Date('2025-01-15T10:30:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success=true with notificationId, sentAt, deliveryMethod=email, nonSubmittedReporterCount=2, and errorDetails=null when all conditions are met', async () => {
    // Setup: Mock validateUserHasLeaderRole to verify leader is valid
    jest.mocked(validateUserHasLeaderRole).mockResolvedValue({
      hasLeaderRole: true,
      userId: mockInput.leaderId,
      denialReason: null,
    });

    // Setup: Mock judgeSchedulerExecutionTiming to return business hours
    jest.mocked(judgeSchedulerExecutionTiming).mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: 'Within business hours',
    });

    // Setup: Mock sendNonSubmissionPromptNotification to return success
    jest.mocked(sendNonSubmissionPromptNotification).mockResolvedValue({
      success: true,
      totalTargets: 2,
      successCount: 2,
      failureCount: 0,
      emailSendingHistoryIds: ['history-001', 'history-002'],
      sentAt: mockInput.executionTimestamp.toISOString(),
      failedReporterIds: null,
      errorMessage: null,
    });

    // Test: Call sendLeaderNonSubmissionPromptNotification
    const result: SendLeaderNonSubmissionPromptNotificationOutput = await sendLeaderNonSubmissionPromptNotification(
      mockInput,
    );

    // Verify: Output should have all expected values
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
