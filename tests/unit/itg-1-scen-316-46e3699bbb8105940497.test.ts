import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  EmailDeliveryFailureError,
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

describe('SCEN-316: EmailDeliveryFailureError when email sending service is unavailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw EmailDeliveryFailureError with message "Failed to send notification email to leader." when email delivery fails', async () => {
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

    const mockSendNonSubmissionPromptNotification = emailModule.sendNonSubmissionPromptNotification as jest.MockedFunction<any>;
    mockSendNonSubmissionPromptNotification.mockRejectedValueOnce(
      new EmailDeliveryFailureError('Failed to send notification email to leader.')
    );

    const input = {
      leaderId: 'valid-leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'valid-reminder-setting-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(EmailDeliveryFailureError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('Failed to send notification email to leader.');
  });
});
