import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  SendNonSubmissionPromptNotificationInput,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-540: failedReporterIds is null on full success', () => {
  it('should return failedReporterIds as null when all sending succeeds', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'reporter-001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'reporter-002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'reporter-003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds.length).toBe(3);
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });

  it('should verify all output fields match expected structure', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'reporter-001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'reporter-002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'reporter-003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result: SendNonSubmissionPromptNotificationOutput = sendNonSubmissionPromptNotification(input);

    // Check required fields presence
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('totalTargets');
    expect(result).toHaveProperty('successCount');
    expect(result).toHaveProperty('failureCount');
    expect(result).toHaveProperty('emailSendingHistoryIds');
    expect(result).toHaveProperty('sentAt');
    expect(result).toHaveProperty('failedReporterIds');
    expect(result).toHaveProperty('errorMessage');

    // Check types and values
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.totalTargets).toBe('number');
    expect(typeof result.successCount).toBe('number');
    expect(typeof result.failureCount).toBe('number');
    expect(Array.isArray(result.emailSendingHistoryIds)).toBe(true);
    expect(typeof result.sentAt).toBe('string');
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });
});
