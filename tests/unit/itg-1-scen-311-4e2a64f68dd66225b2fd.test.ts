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
  NotificationBuildFailureError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-311: NotificationBuildFailureError when notification content build fails', () => {
  const mockInput: SendLeaderSubmissionNotificationInput = {
    reporterId: 'valid-reporter-id',
    leaderId: 'valid-leader-id',
    targetDate: new Date('2024-01-15'),
    submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
    executionTimestamp: new Date('2024-01-15T09:35:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotificationBuildFailureError when notification content build fails', async () => {
    await expect(
      sendLeaderSubmissionNotification(mockInput)
    ).rejects.toThrow(NotificationBuildFailureError);
  });

  it('NotificationBuildFailureError should contain correct error message', async () => {
    try {
      await sendLeaderSubmissionNotification(mockInput);
      throw new Error('Expected NotificationBuildFailureError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NotificationBuildFailureError);
      expect((error as Error).message).toBe('通知内容の構築に失敗しました。');
    }
  });
});
