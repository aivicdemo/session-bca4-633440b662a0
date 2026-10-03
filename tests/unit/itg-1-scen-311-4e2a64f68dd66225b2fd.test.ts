import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserHasLeaderRole: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

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

  it('should throw NotificationBuildFailureError with message "通知内容の構築に失敗しました。" when buildReminderNotificationContent fails', async () => {
    // Setup: Mock external dependencies to succeed
    // Note: buildReminderNotificationContent, selectNotificationDeliveryMethod, and
    // recordReminderNotificationSendingResult are NOT mocked as they are in the same module
    // and will execute normally. The test verifies the error handling when buildReminderNotificationContent
    // fails within the actual implementation.

    jest.mocked(validateUserHasLeaderRole).mockResolvedValue({
      hasLeaderRole: true,
      userId: mockInput.leaderId,
      denialReason: null,
    });

    jest.mocked(retrieveDailyReportsForLeaderReview).mockResolvedValue({
      dailyReports: [
        {
          dailyReportId: 'report-001',
          userId: mockInput.reporterId,
          reportDate: mockInput.targetDate.toISOString().split('T')[0],
          businessContent: 'test content',
          submittedAt: mockInput.submissionTimestamp.toISOString(),
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      retrievedAt: mockInput.executionTimestamp.toISOString(),
    });

    jest.mocked(sendDailyReportSubmissionNotification).mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-123',
      sentAt: mockInput.executionTimestamp.toISOString(),
      errorMessage: null,
      adminNotificationSent: false,
    });

    // Test: sendLeaderSubmissionNotification should throw NotificationBuildFailureError
    // This will happen when the internal implementation tries to build notification content
    // and encounters a failure condition (e.g., missing template, insufficient data)
    await expect(
      sendLeaderSubmissionNotification(mockInput),
    ).rejects.toThrow(NotificationBuildFailureError);

    // Verify: Error message should be exactly "通知内容の構築に失敗しました。"
    try {
      await sendLeaderSubmissionNotification(mockInput);
      fail('Expected NotificationBuildFailureError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NotificationBuildFailureError);
      expect((error as NotificationBuildFailureError).message).toBe('通知内容の構築に失敗しました。');
    }
  });
});
