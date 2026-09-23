import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  SendNonSubmissionPromptNotificationInput,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-541: errorMessage is null on full success', () => {
  it('should return errorMessage as null when all sending succeeds', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2025-01-15',
        },
        {
          userId: 'U002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2025-01-15',
        },
        {
          userId: 'U003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2025-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'DL-2025-01-15-001',
      promptReason: '定時リマインダー',
      targetDate: '2025-01-15',
    };

    const result = sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds.length).toBe(3);
    expect(result.emailSendingHistoryIds).toContain('SH-2025-01-15-001');
    expect(result.emailSendingHistoryIds).toContain('SH-2025-01-15-002');
    expect(result.emailSendingHistoryIds).toContain('SH-2025-01-15-003');
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
  });

  it('should have all output fields correctly set', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2025-01-15',
        },
        {
          userId: 'U002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2025-01-15',
        },
        {
          userId: 'U003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2025-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'DL-2025-01-15-001',
      promptReason: '定時リマインダー',
      targetDate: '2025-01-15',
    };

    const result: SendNonSubmissionPromptNotificationOutput = sendNonSubmissionPromptNotification(input);

    // Verify all required fields
    expect(result.success).toStrictEqual(true);
    expect(result.totalTargets).toStrictEqual(3);
    expect(result.successCount).toStrictEqual(3);
    expect(result.failureCount).toStrictEqual(0);
    expect(Array.isArray(result.emailSendingHistoryIds)).toBe(true);
    expect(result.emailSendingHistoryIds.length).toBe(3);
    expect(typeof result.sentAt).toBe('string');
    expect(result.failedReporterIds).toStrictEqual(null);
    expect(result.errorMessage).toStrictEqual(null);
  });

  it('should verify sentAt is ISO 8601 formatted', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2025-01-15',
        },
        {
          userId: 'U002',
          userName: '鈴木花子',
          userEmailAddress: 'suzuki@example.com',
          targetDate: '2025-01-15',
        },
        {
          userId: 'U003',
          userName: '佐藤次郎',
          userEmailAddress: 'sato@example.com',
          targetDate: '2025-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'DL-2025-01-15-001',
      promptReason: '定時リマインダー',
      targetDate: '2025-01-15',
    };

    const result = sendNonSubmissionPromptNotification(input);

    // ISO 8601 format regex
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(result.sentAt).toMatch(iso8601Regex);
  });
});
