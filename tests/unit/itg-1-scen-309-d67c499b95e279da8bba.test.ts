jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/notification-persistence');

import {
  sendLeaderSubmissionNotification,
  DailyReportNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-309: DailyReportNotFoundError when daily report does not exist for target date', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DailyReportNotFoundError with message "指定日付の日報が見つかりません。" when no daily report exists for target date', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T09:30:00Z'),
      executionTimestamp: new Date('2025-01-15T09:35:00Z'),
    };

    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(DailyReportNotFoundError);
    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow('指定日付の日報が見つかりません。');
  });
});
