import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sendLeaderSubmissionNotification,
  EmailDeliveryFailureError,
  SendLeaderSubmissionNotificationInput,
  SendLeaderSubmissionNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';
import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-310: EmailDeliveryFailureError when email delivery fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return output with success=false and error message when email delivery fails', async () => {
    const input: SendLeaderSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T09:30:00Z',
      executionTimestamp: '2024-01-15T09:35:00Z',
    };

    const expectedOutput: SendLeaderSubmissionNotificationOutput = {
      success: false,
      notificationId: null,
      sentAt: null,
      deliveryMethod: null,
      errorDetails: 'メール送信に失敗しました。後で再試行してください。',
    };

    (sendLeaderSubmissionNotification as jest.Mock).mockImplementationOnce(async () => expectedOutput);

    const result = await sendLeaderSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('メール送信に失敗しました。後で再試行してください。');
  });
});
