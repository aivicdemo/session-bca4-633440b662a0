import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderNonSubmissionPromptNotification,
  LeaderNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendNonSubmissionPromptNotification: jest.fn(),
}));

describe('SCEN-313: LeaderNotFoundError when specified leader does not exist or lacks leader role', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderNotFoundError with message "Leader not found or does not have leader role." when leader does not exist', async () => {
    const mockValidateUserHasLeaderRole = userAuthModule.validateUserHasLeaderRole as jest.MockedFunction<any>;
    mockValidateUserHasLeaderRole.mockRejectedValueOnce(
      new LeaderNotFoundError('Leader not found or does not have leader role.')
    );

    const input = {
      leaderId: 'non-existent-leader',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001', 'reporter-002'],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(LeaderNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('Leader not found or does not have leader role.');
  });

  it('should throw LeaderNotFoundError when leader lacks leader role', async () => {
    const mockValidateUserHasLeaderRole = userAuthModule.validateUserHasLeaderRole as jest.MockedFunction<any>;
    mockValidateUserHasLeaderRole.mockRejectedValueOnce(
      new LeaderNotFoundError('Leader not found or does not have leader role.')
    );

    const input = {
      leaderId: 'regular-user-001',
      targetDate: new Date('2024-01-15'),
      nonSubmittedReporterIds: ['reporter-001'],
      reminderSettingId: 'setting-001',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow(LeaderNotFoundError);
    await expect(sendLeaderNonSubmissionPromptNotification(input)).rejects.toThrow('Leader not found or does not have leader role.');
  });
});
