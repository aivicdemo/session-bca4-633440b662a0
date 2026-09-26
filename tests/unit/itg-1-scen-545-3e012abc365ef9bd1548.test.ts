import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/adapters/amazon-ses-adapter');

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

describe('SCEN-545: successCountがメール送信に成功した対象者の数と一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successCountがメール送信に成功した対象者の数と一致すること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'user1', userName: 'User 1', userEmailAddress: 'user1@example.com', targetDate: '2024-01-15' },
        { userId: 'user2', userName: 'User 2', userEmailAddress: 'user2@example.com', targetDate: '2024-01-15' },
        { userId: 'user3', userName: 'User 3', userEmailAddress: 'user3@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-12345',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      totalTargets: 3,
      successCount: 3,
      failureCount: 0,
      emailSendingHistoryIds: ['hist-001', 'hist-002', 'hist-003'],
      sentAt: '2024-01-15T14:30:45.123Z',
      failedReporterIds: null,
      errorMessage: null,
    });

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.successCount).toBe(3);
    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.emailSendingHistoryIds).toEqual(['hist-001', 'hist-002', 'hist-003']);
  });
});
