import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';
import type {
  SendNonSubmissionPromptNotificationInput,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-546: failureCount がメール送信に失敗した対象者の数と一致する', () => {
  beforeEach(() => {
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue(true);
    jest.mocked(buildNotificationContent).mockResolvedValue('催促メール本文');
    jest.mocked(recordEmailSendingHistory)
      .mockResolvedValueOnce('hist-001')
      .mockResolvedValueOnce('hist-002')
      .mockResolvedValueOnce('hist-003')
      .mockResolvedValueOnce('hist-004')
      .mockResolvedValueOnce('hist-005');
  });

  it('5名のうち3名の送信成功、2名の送信失敗により、failureCount が 2 と一致すること', async () => {
    jest.mocked(sendNonSubmissionPromptNotification).mockResolvedValueOnce({
      success: false,
      totalTargets: 5,
      successCount: 3,
      failureCount: 2,
      sentAt: new Date().toISOString(),
      failedReporterIds: ['user-004', 'user-005'],
      errorMessage: '一部の催促メール送信に失敗しました。成功件数: 3, 失敗件数: 2。',
      emailSendingHistoryIds: ['hist-001', 'hist-002', 'hist-003', 'hist-004', 'hist-005'],
    });

    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          userName: '報告者1',
          userEmailAddress: 'reporter1@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user-002',
          userName: '報告者2',
          userEmailAddress: 'reporter2@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user-003',
          userName: '報告者3',
          userEmailAddress: 'reporter3@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user-004',
          userName: '報告者4',
          userEmailAddress: 'reporter4@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user-005',
          userName: '報告者5',
          userEmailAddress: 'reporter5@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-12345',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result: SendNonSubmissionPromptNotificationOutput = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(false);
    expect(result.totalTargets).toBe(5);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(2);
    expect(result.emailSendingHistoryIds).toHaveLength(5);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.failedReporterIds).toEqual(['user-004', 'user-005']);
    expect(result.errorMessage).toBe('一部の催促メール送信に失敗しました。成功件数: 3, 失敗件数: 2。');
  });
});
