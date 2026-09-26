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
  DailyReportNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-309: DailyReportNotFoundError when daily report is not found', () => {
  const mockInput: SendLeaderSubmissionNotificationInput = {
    reporterId: 'reporter-001',
    leaderId: 'leader-001',
    targetDate: new Date('2025-01-15'),
    submissionTimestamp: new Date('2025-01-15T09:30:00Z'),
    executionTimestamp: new Date('2025-01-15T09:35:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DailyReportNotFoundError when daily report does not exist for target date', async () => {
    await expect(
      sendLeaderSubmissionNotification(mockInput)
    ).rejects.toThrow(DailyReportNotFoundError);
  });

  it('DailyReportNotFoundError should contain correct error message', async () => {
    try {
      await sendLeaderSubmissionNotification(mockInput);
      throw new Error('Expected DailyReportNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DailyReportNotFoundError);
      expect((error as Error).message).toBe('指定日付の日報が見つかりません。');
    }
  });
});
