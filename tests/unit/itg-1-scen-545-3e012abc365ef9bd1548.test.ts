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

describe('SCEN-545: successCount がメール送信に成功した対象者の数と一致する', () => {
  beforeEach(() => {
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue(true);
    jest.mocked(buildNotificationContent).mockResolvedValue('催促メール本文');
    jest.mocked(recordEmailSendingHistory)
      .mockResolvedValueOnce('hist-001')
      .mockResolvedValueOnce('hist-002')
      .mockResolvedValueOnce('hist-003');
  });

  it('すべての催促メール送信が成功し、successCount が 3 と一致すること', async () => {
    jest.mocked(sendNonSubmissionPromptNotification).mockResolvedValueOnce({
      success: true,
      totalTargets: 3,
      successCount: 3,
      failureCount: 0,
      sentAt: new Date().toISOString(),
      failedReporterIds: null,
      errorMessage: null,
      emailSendingHistoryIds: ['hist-001', 'hist-002', 'hist-003'],
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
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-12345',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result: SendNonSubmissionPromptNotificationOutput = await sendNonSubmissionPromptNotification(input);

    expect(result.successCount).toBe(3);
    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(result.emailSendingHistoryIds).toHaveLength(3);
    expect(result.emailSendingHistoryIds).toEqual(['hist-001', 'hist-002', 'hist-003']);
  });
});
