import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderSubmissionNotification,
  InvalidReporterIdError,
  SendLeaderSubmissionNotificationInput,
} from '../../src/logic/daily-report-reminder-notification';
import { validateUserHasLeaderRole } from '../../src/logic/user-authentication-authorization';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import {
  buildReminderNotificationContent,
  selectNotificationDeliveryMethod,
  recordReminderNotificationSendingResult,
} from '../../src/logic/daily-report-reminder-notification';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-308: InvalidReporterIdError when invalid reporterId is provided', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const invalidReporterIds = [
    { value: '', description: 'empty string' },
    { value: null, description: 'null' },
    { value: undefined, description: 'undefined' },
    { value: '!@#$', description: 'special characters only' },
    { value: '123-456-789', description: 'different format' },
  ];

  invalidReporterIds.forEach(({ value, description }) => {
    it(`should throw InvalidReporterIdError with message "報告者IDが無効です。" when reporterId is ${description}`, async () => {
      const input: SendLeaderSubmissionNotificationInput = {
        reporterId: value as any,
        leaderId: 'leader-001',
        targetDate: '2025-01-15',
        submissionTimestamp: '2025-01-15T09:30:00Z',
        executionTimestamp: '2025-01-15T09:35:00Z',
      };

      const mockError = new InvalidReporterIdError('報告者IDが無効です。');

      (sendLeaderSubmissionNotification as jest.Mock).mockImplementationOnce(async () => {
        throw mockError;
      });

      await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(InvalidReporterIdError);
      await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow('報告者IDが無効です。');

      expect(validateUserHasLeaderRole).not.toHaveBeenCalled();
      expect(retrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
      expect(buildReminderNotificationContent).not.toHaveBeenCalled();
      expect(selectNotificationDeliveryMethod).not.toHaveBeenCalled();
      expect(sendDailyReportSubmissionNotification).not.toHaveBeenCalled();
      expect(recordReminderNotificationSendingResult).not.toHaveBeenCalled();
    });
  });
});
