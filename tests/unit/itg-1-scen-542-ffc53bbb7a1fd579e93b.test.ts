import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/adapters/amazon-ses-adapter');

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

describe('SCEN-542: メール送信に失敗が発生したとき、failedReporterIdsに失敗した対象者のユーザーIDが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信に一部失敗が発生したとき、failedReporterIdsに失敗したユーザーIDが配列として返されること', async () => {
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
      success: false,
      totalTargets: 3,
      successCount: 2,
      failureCount: 1,
      emailSendingHistoryIds: ['hist-001', 'hist-002', 'hist-003'],
      sentAt: '2024-01-15T14:30:45.123Z',
      failedReporterIds: ['user3'],
      errorMessage: '一部の催促メール送信に失敗しました。成功件数: 2, 失敗件数: 1。',
    });

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(false);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(1);
    expect(result.emailSendingHistoryIds).toEqual(['hist-001', 'hist-002', 'hist-003']);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toEqual(['user3']);
    expect(result.errorMessage).toContain('一部の催促メール送信に失敗しました');
    expect(result.errorMessage).toContain('成功件数: 2');
    expect(result.errorMessage).toContain('失敗件数: 1');
  });
});
