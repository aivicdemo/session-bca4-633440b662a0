import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/adapters/amazon-ses-adapter');

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

describe('SCEN-541: 全件成功時、errorMessageがnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全件成功時、errorMessageがnullで返されること', async () => {
    const input = {
      nonSubmittedReporters: [
        { userId: 'U001', userName: '田中太郎', userEmailAddress: 'tanaka@example.com', targetDate: '2025-01-15' },
        { userId: 'U002', userName: '鈴木花子', userEmailAddress: 'suzuki@example.com', targetDate: '2025-01-15' },
        { userId: 'U003', userName: '佐藤次郎', userEmailAddress: 'sato@example.com', targetDate: '2025-01-15' },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'DL-2025-01-15-001',
      promptReason: '定時リマインダー',
      targetDate: '2025-01-15',
    };

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      totalTargets: 3,
      successCount: 3,
      failureCount: 0,
      emailSendingHistoryIds: ['SH-2025-01-15-001', 'SH-2025-01-15-002', 'SH-2025-01-15-003'],
      sentAt: '2025-01-15T15:30:45.123Z',
      failedReporterIds: null,
      errorMessage: null,
    });

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toEqual(['SH-2025-01-15-001', 'SH-2025-01-15-002', 'SH-2025-01-15-003']);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
