import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderSubmissionNotification,
  DailyReportNotFoundError,
  SendLeaderSubmissionNotificationInput,
} from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-309: DailyReportNotFoundError when daily report does not exist for target date', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DailyReportNotFoundError with message "指定日付の日報が見つかりません。" when no daily report exists for target date', async () => {
    const input: SendLeaderSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
      submissionTimestamp: '2025-01-15T09:30:00Z',
      executionTimestamp: '2025-01-15T09:35:00Z',
    };

    const mockError = new DailyReportNotFoundError('指定日付の日報が見つかりません。');

    (sendLeaderSubmissionNotification as jest.Mock).mockImplementationOnce(async () => {
      throw mockError;
    });

    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(DailyReportNotFoundError);
    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow('指定日付の日報が見つかりません。');
  });
});
