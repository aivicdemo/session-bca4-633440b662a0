import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  SendNonSubmissionPromptNotificationInput,
  SendNonSubmissionPromptNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-539: All sending history recorded even on failure', () => {
  it('should return success=false with 1 success and 2 failures', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user1',
          userName: 'Reporter1',
          userEmailAddress: 'reporter1@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user2',
          userName: 'Reporter2',
          userEmailAddress: 'reporter2@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user3',
          userName: 'Reporter3',
          userEmailAddress: 'reporter3@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(false);
    expect(result.totalTargets).toBe(3);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(2);
    expect(result.emailSendingHistoryIds.length).toBe(3);
    expect(result.emailSendingHistoryIds).toEqual([
      'history-001',
      'history-002',
      'history-003',
    ]);
    expect(result.failedReporterIds).toEqual(['user2', 'user3']);
    expect(result.errorMessage).toBe('一部の催促メール送信に失敗しました。成功件数: 1, 失敗件数: 2。');
  });

  it('should record all 3 sending history records regardless of success or failure', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user1',
          userName: 'Reporter1',
          userEmailAddress: 'reporter1@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user2',
          userName: 'Reporter2',
          userEmailAddress: 'reporter2@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user3',
          userName: 'Reporter3',
          userEmailAddress: 'reporter3@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = sendNonSubmissionPromptNotification(input);

    // Verify all 3 history records are present
    expect(result.emailSendingHistoryIds.length).toBe(3);
    expect(result.emailSendingHistoryIds[0]).toBe('history-001');
    expect(result.emailSendingHistoryIds[1]).toBe('history-002');
    expect(result.emailSendingHistoryIds[2]).toBe('history-003');
  });

  it('should have sentAt as ISO 8601 formatted datetime', () => {
    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'user1',
          userName: 'Reporter1',
          userEmailAddress: 'reporter1@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user2',
          userName: 'Reporter2',
          userEmailAddress: 'reporter2@example.com',
          targetDate: '2024-01-15',
        },
        {
          userId: 'user3',
          userName: 'Reporter3',
          userEmailAddress: 'reporter3@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'leader1',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'log-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = sendNonSubmissionPromptNotification(input);

    // Verify sentAt is ISO 8601 format
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
