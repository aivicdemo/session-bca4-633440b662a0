import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserHasLeaderRole: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  buildReminderNotificationContent: jest.fn(),
  selectNotificationDeliveryMethod: jest.fn(),
  recordReminderNotificationSendingResult: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendLeaderSubmissionNotification,
  type SendLeaderSubmissionNotificationInput,
  InvalidReporterIdError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-308: InvalidReporterIdError when reporter ID is invalid', () => {
  const baseInput: Omit<SendLeaderSubmissionNotificationInput, 'reporterId'> = {
    leaderId: 'leader-001',
    targetDate: new Date('2025-01-15'),
    submissionTimestamp: new Date('2025-01-15T09:30:00Z'),
    executionTimestamp: new Date('2025-01-15T09:35:00Z'),
  };

  const invalidReporterIds = ['', '!@#$', '123-456-789'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(invalidReporterIds)('should throw InvalidReporterIdError for reporterId: %s', async (reporterId) => {
    const input: SendLeaderSubmissionNotificationInput = {
      ...baseInput,
      reporterId: reporterId as any,
    };

    await expect(
      sendLeaderSubmissionNotification(input)
    ).rejects.toThrow(InvalidReporterIdError);
  });

  it('InvalidReporterIdError should contain correct error message', async () => {
    const input: SendLeaderSubmissionNotificationInput = {
      ...baseInput,
      reporterId: '',
    };

    try {
      await sendLeaderSubmissionNotification(input);
      throw new Error('Expected InvalidReporterIdError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidReporterIdError);
      expect((error as Error).message).toContain('報告者IDが無効です。');
    }
  });
});
