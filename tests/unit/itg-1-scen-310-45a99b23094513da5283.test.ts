jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/notification-persistence');

import {
  sendLeaderSubmissionNotification,
  EmailDeliveryFailureError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-310: EmailDeliveryFailureError when email delivery fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return output with success=false and error message when email delivery fails', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2024-01-15'),
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      executionTimestamp: new Date('2024-01-15T09:35:00Z'),
    };

    const result = await sendLeaderSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('メール送信に失敗しました。後で再試行してください。');
  });
});
