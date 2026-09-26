import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/adapters/amazon-ses-adapter');

import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;

describe('SCEN-546: failureCount がメール送信に失敗した対象者の数と一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('催促対象者5名のうち、3名送信成功、2名送信失敗の場合、failureCount が 2 と一致する', async () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U002',
          userName: '鈴木次郎',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U003',
          userName: '佐藤三郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U004',
          userName: '伊藤四郎',
          userEmailAddress: 'ito@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'U005',
          userName: '渡辺五郎',
          userEmailAddress: 'watanabe@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時催促',
      targetDate: '2024-01-15',
    };

    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      success: false,
      totalTargets: 5,
      successCount: 3,
      failureCount: 2,
      emailSendingHistoryIds: ['hist-001', 'hist-002', 'hist-003', 'hist-004', 'hist-005'],
      sentAt: '2024-01-15T14:30:45.123Z',
      failedReporterIds: ['U004', 'U005'],
      errorMessage: '一部の催促メール送信に失敗しました。成功件数: 3, 失敗件数: 2。',
    });

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(false);
    expect(result.totalTargets).toBe(5);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(2);
    expect(result.emailSendingHistoryIds).toHaveLength(5);
    expect(result.emailSendingHistoryIds).toEqual(['hist-001', 'hist-002', 'hist-003', 'hist-004', 'hist-005']);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.failedReporterIds).toEqual(['U004', 'U005']);
    expect(result.errorMessage).toContain('一部の催促メール送信に失敗しました');
    expect(result.errorMessage).toContain('成功件数: 3');
    expect(result.errorMessage).toContain('失敗件数: 2');
  });
});
