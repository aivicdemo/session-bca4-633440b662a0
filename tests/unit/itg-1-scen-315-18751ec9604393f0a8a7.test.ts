import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  ReminderSettingNotConfiguredError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as judgmentModule from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendNonSubmissionPromptNotification: jest.fn(),
}));

describe('SCEN-315: ReminderSettingNotConfiguredError when reminder settings are not configured or disabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReminderSettingNotConfiguredError when reminder settings are not configured', async () => {
    const mockValidateUserHasLeaderRole = userAuthModule.validateUserHasLeaderRole as jest.MockedFunction<any>;
    mockValidateUserHasLeaderRole.mockResolvedValueOnce(undefined);

    const mockJudgeSchedulerExecutionTiming = judgmentModule.judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
    mockJudgeSchedulerExecutionTiming.mockResolvedValueOnce({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: 'within business hours',
    });

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
