import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  NonSubmittedReportersNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendNonSubmissionPromptNotification: jest.fn(),
}));

describe('SCEN-314: NonSubmittedReportersNotFoundError when non-submitted reporter list is empty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NonSubmittedReportersNotFoundError with message "No non-submitted reporters found for the target date." when reporter list is empty', async () => {
    const mockValidateUserHasLeaderRole = userAuthModule.validateUserHasLeaderRole as jest.MockedFunction<any>;
    mockValidateUserHasLeaderRole.mockResolvedValueOnce(undefined);

    const input = {
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: [],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(NonSubmittedReportersNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('No non-submitted reporters found for the target date.');
  });
});
