import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/adapters/amazon-ses-adapter');

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

describe('SCEN-543: 送信処理の実行日時がISO 8601形式で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('送信処理の実行日時がISO 8601形式で返されること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'user1', userName: 'User 1', userEmailAddress: 'user1@example.com', targetDate: '2024-01-15' },
        { userId: 'user2', userName: 'User 2', userEmailAddress: 'user2@example.com', targetDate: '2024-01-15' },
        { userId: 'user3', userName: 'User 3', userEmailAddress: 'user3@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      totalTargets: 3,
      successCount: 3,
      failureCount: 0,
      emailSendingHistoryIds: ['history-001', 'history-002', 'history-003'],
      sentAt: '2024-01-15T14:30:45.123Z',
      failedReporterIds: null,
      errorMessage: null,
    });

    const result = await sendNonSubmissionPromptNotification(input);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(result.sentAt).toMatch(iso8601Regex);

    // Parse the date to ensure it's a valid ISO 8601 format
    const parsedDate = new Date(result.sentAt);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate.getTime()).not.toBeNaN();
  });
});
