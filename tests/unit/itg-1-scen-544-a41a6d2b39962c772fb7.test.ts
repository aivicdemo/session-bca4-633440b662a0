import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/adapters/amazon-ses-adapter');

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

describe('SCEN-544: totalTargetsが催促対象者リストの件数と一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('totalTargetsが催促対象者リストの件数と一致すること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2024-01-15' },
        { userId: 'U002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2024-01-15' },
        { userId: 'U003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2024-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-20240115-001',
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

    expect(result.totalTargets).toBe(3);
    expect(result.totalTargets).toBe(input.nonSubmittedReporters.length);
  });
});
