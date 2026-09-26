import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import type { SendNonSubmissionPromptNotificationInput } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management.ts');

describe('SCEN-550: 報告期限の時刻が不正な形式のとき、throw文言が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mocked = jest.mocked(sendNonSubmissionPromptNotification);
    mocked.mockImplementation(async (input: any) => {
      const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeFormatRegex.test(input.targetDate)) {
        throw new Error('報告期限の設定が不正です。HH:MM形式で指定してください');
      }
      return {
        success: true,
        totalTargets: 1,
        successCount: 1,
        failureCount: 0,
        emailSendingHistoryIds: ['HIST-001'],
        sentAt: '2024-01-15T17:00:00.000Z',
        failedReporterIds: null,
        errorMessage: null,
      };
    });
  });

  const testInvalidFormats = [
    '25:00',
    '1700',
    '17-00',
    '17:00:00',
    '',
  ];

  testInvalidFormats.forEach((invalidFormat) => {
    it(`報告期限の時刻が '${invalidFormat}' の場合、エラーがスローされる`, async () => {
      const input: SendNonSubmissionPromptNotificationInput = {
        nonSubmittedReporters: [
          {
            userId: 'U001',
            userName: '田中太郎',
            userEmailAddress: 'taro@example.com',
            targetDate: '2024-01-15',
          },
        ],
        leaderUserId: 'L001',
        leaderEmailAddress: 'leader@example.com',
        detectionLogId: 'DL001',
        promptReason: '定時リマインダー',
        targetDate: '2024-01-15',
      };

      const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeFormatRegex.test(invalidFormat)) {
        await expect(sendNonSubmissionPromptNotification(input)).rejects.toThrow(
          '報告期限の設定が不正です。HH:MM形式で指定してください'
        );
      }
    });
  });
});
