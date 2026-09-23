import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderSubmissionNotification,
  NotificationBuildFailureError,
  SendLeaderSubmissionNotificationInput,
  buildReminderNotificationContent,
} from '../../src/logic/daily-report-reminder-notification';
import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import { selectNotificationDeliveryMethod, recordReminderNotificationSendingResult } from '../../src/logic/daily-report-reminder-notification';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-311: NotificationBuildFailureError when notification content building fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotificationBuildFailureError with message "通知内容の構築に失敗しました。" when buildReminderNotificationContent fails', async () => {
    const input: SendLeaderSubmissionNotificationInput = {
      reporterId: 'valid-reporter-id',
      leaderId: 'valid-leader-id',
      targetDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T09:30:00Z',
      executionTimestamp: '2024-01-15T09:35:00Z',
    };

    const mockError = new NotificationBuildFailureError('通知内容の構築に失敗しました。');

    (sendLeaderSubmissionNotification as jest.Mock).mockImplementationOnce(async () => {
      throw mockError;
    });

    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(NotificationBuildFailureError);
    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow('通知内容の構築に失敗しました。');
  });
});
