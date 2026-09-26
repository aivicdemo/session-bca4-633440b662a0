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
  LeaderNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-307: LeaderNotFoundError when leader not found', () => {
  const mockInput: SendLeaderSubmissionNotificationInput = {
    reporterId: 'reporter-001',
    leaderId: 'leader-001',
    targetDate: new Date('2025-01-15'),
    submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
    executionTimestamp: new Date('2025-01-15T10:35:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderNotFoundError when leader is not found', async () => {
    await expect(
      sendLeaderSubmissionNotification(mockInput)
    ).rejects.toThrow(LeaderNotFoundError);
  });

  it('LeaderNotFoundError should contain correct error message', async () => {
    try {
      await sendLeaderSubmissionNotification(mockInput);
      throw new Error('Expected LeaderNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderNotFoundError);
      expect((error as Error).message).toBe('リーダー情報が見つかりません。報告者のチーム設定を確認してください。');
    }
  });
});
