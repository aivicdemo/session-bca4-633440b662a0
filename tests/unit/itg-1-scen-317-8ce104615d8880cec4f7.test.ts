import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  InvalidExecutionTimingError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as judgmentModule from '../../src/logic/business-day-deadline-judgment';
import * as emailModule from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendNonSubmissionPromptNotification: jest.fn(),
}));

describe('SCEN-317: InvalidExecutionTimingError when execution timing is outside business hours', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidExecutionTimingError when execution timestamp is outside business hours', async () => {
    const mockValidateUserHasLeaderRole = userAuthModule.validateUserHasLeaderRole as jest.MockedFunction<any>;
    mockValidateUserHasLeaderRole.mockResolvedValueOnce(undefined);

    const mockJudgeSchedulerExecutionTiming = judgmentModule.judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
    mockJudgeSchedulerExecutionTiming.mockRejectedValueOnce(
      new InvalidExecutionTimingError('Execution timing is outside business hours or not a business day.')
    );

    const input = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'reminder-setting-001',
      executionTimestamp: new Date('2024-01-15T22:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(InvalidExecutionTimingError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(
      'Execution timing is outside business hours or not a business day.'
    );

    const mockSendNonSubmissionPrompt = emailModule.sendNonSubmissionPromptNotification as jest.MockedFunction<any>;
    expect(mockSendNonSubmissionPrompt).not.toHaveBeenCalled();
  });

  it('should throw InvalidExecutionTimingError when execution timestamp is on a non-business day', async () => {
    const mockValidateUserHasLeaderRole = userAuthModule.validateUserHasLeaderRole as jest.MockedFunction<any>;
    mockValidateUserHasLeaderRole.mockResolvedValueOnce(undefined);

    const mockJudgeSchedulerExecutionTiming = judgmentModule.judgeSchedulerExecutionTiming as jest.MockedFunction<any>;
    mockJudgeSchedulerExecutionTiming.mockRejectedValueOnce(
      new InvalidExecutionTimingError('Execution timing is outside business hours or not a business day.')
    );

    const input = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-20'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'reminder-setting-001',
      executionTimestamp: new Date('2024-01-20T10:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(InvalidExecutionTimingError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(
      'Execution timing is outside business hours or not a business day.'
    );
  });
});
