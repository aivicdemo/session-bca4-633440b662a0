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
  type SendLeaderSubmissionNotificationOutput,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-310: EmailDeliveryFailureError when mail service is unavailable', () => {
  const mockInput: SendLeaderSubmissionNotificationInput = {
    reporterId: 'reporter-001',
    leaderId: 'leader-001',
    targetDate: new Date('2024-01-15'),
    submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
    executionTimestamp: new Date('2024-01-15T09:35:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return output with success=false when email delivery fails', async () => {
    const result = await sendLeaderSubmissionNotification(mockInput);
    
    expect(result.success).toBe(false);
    expect(result.notificationId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.deliveryMethod).toBeNull();
    expect(result.errorDetails).toBe('メール送信に失敗しました。後で再試行してください。');
  });

  it('should match output type SendLeaderSubmissionNotificationOutput structure', async () => {
    const result: SendLeaderSubmissionNotificationOutput = await sendLeaderSubmissionNotification(mockInput);
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('notificationId');
    expect(result).toHaveProperty('sentAt');
    expect(result).toHaveProperty('deliveryMethod');
    expect(result).toHaveProperty('errorDetails');
  });
});
