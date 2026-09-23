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

describe('SCEN-547: emailSendingHistoryIds の件数が成功件数と失敗件数の合計と一致する', () => {
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

  it('emailSendingHistoryIds の件数が successCount と failureCount の合計と一致すること', async () => {
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
      promptReason: '手動催促',
      targetDate: '2024-01-15',
    };

    const result: SendNonSubmissionPromptNotificationOutput = await sendNonSubmissionPromptNotification(input);

    const emailSendingHistoryIdsCount = result.emailSendingHistoryIds.length;
    const successFailureCount = result.successCount + result.failureCount;

    expect(emailSendingHistoryIdsCount).toBe(5);
    expect(successFailureCount).toBe(5);
    expect(emailSendingHistoryIdsCount).toBe(successFailureCount);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(2);
  });
});
