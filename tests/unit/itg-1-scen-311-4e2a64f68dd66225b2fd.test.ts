jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/notification-persistence');

import {
  sendLeaderSubmissionNotification,
  NotificationBuildFailureError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-311: NotificationBuildFailureError when notification content building fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotificationBuildFailureError with message "通知内容の構築に失敗しました。" when buildReminderNotificationContent fails', async () => {
    const input = {
      reporterId: 'valid-reporter-id',
      leaderId: 'valid-leader-id',
      targetDate: new Date('2024-01-15'),
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      executionTimestamp: new Date('2024-01-15T09:35:00Z'),
    };

    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(NotificationBuildFailureError);
    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow('通知内容の構築に失敗しました。');
  });
});
