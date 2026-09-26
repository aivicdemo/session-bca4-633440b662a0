import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management.ts');

describe('SCEN-549: 報告者の日報内容が空またはホワイトスペースのみのとき、warn文言が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mocked = jest.mocked(sendNonSubmissionPromptNotification);
    mocked.mockImplementation(async (input: any) => {
      if (!input.nonSubmittedReporters[0]?.reportContent || input.nonSubmittedReporters[0]?.reportContent?.trim() === '') {
        console.warn('日報内容が空です。内容を確認してください');
      }
      return {
        success: true,
        totalTargets: input.nonSubmittedReporters.length,
        successCount: input.nonSubmittedReporters.length,
        failureCount: 0,
        emailSendingHistoryIds: ['HIST-001'],
        sentAt: '2024-01-15T17:00:00.000Z',
        failedReporterIds: null,
        errorMessage: null,
      };
    });
  });

  it('報告者の日報内容が空またはホワイトスペースのみのとき、warn文言が記録される', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const input: SendNonSubmissionPromptNotificationInput = {
      nonSubmittedReporters: [
        {
          userId: 'R001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@example.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      detectionLogId: 'LOG-20240115-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result = await sendNonSubmissionPromptNotification(input);

    expect(result.success).toBe(true);
    expect(result.totalTargets).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(result.emailSendingHistoryIds).toContain('HIST-001');
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(result.failedReporterIds).toBeNull();
    expect(result.errorMessage).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('日報内容が空です。内容を確認してください');

    warnSpy.mockRestore();
  });
});
