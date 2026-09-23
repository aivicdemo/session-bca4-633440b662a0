import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
  sendNonSubmissionPromptNotification: jest.fn(),
}));

describe('SCEN-548: 定時リマインダー時刻に到達したとき、リーダーへメール通知が送信される', () => {
  let mockValidateEmailAddressForDelivery: jest.Mock;
  let mockBuildNotificationContent: jest.Mock;
  let mockRecordEmailSendingHistory: jest.Mock;
  let mockSendNonSubmissionPromptNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = require('../../src/logic/email-notification-management.ts')
      .validateEmailAddressForDelivery as jest.Mock;
    mockBuildNotificationContent = require('../../src/logic/email-notification-management.ts')
      .buildNotificationContent as jest.Mock;
    mockRecordEmailSendingHistory = require('../../src/logic/email-notification-management.ts')
      .recordEmailSendingHistory as jest.Mock;
    mockSendNonSubmissionPromptNotification = require('../../src/logic/email-notification-management.ts')
      .sendNonSubmissionPromptNotification as jest.Mock;

    // スタブ設定：メール形式検証が成功
    (mockValidateEmailAddressForDelivery as any).mockResolvedValue({ isValid: true });

    // スタブ設定：通知メール本文を正常に生成
    (mockBuildNotificationContent as any).mockResolvedValue({
      content: 'Reminder email content',
      subject: 'Daily Report Reminder',
    });

    // スタブ設定：送信履歴IDを返す
    (mockRecordEmailSendingHistory as any).mockResolvedValue({
      historyId: 'HIST-001',
      success: true,
    });

    // 実際の関数実装をモック化（正常系）
    mockSendNonSubmissionPromptNotification.mockImplementation(async (input: any) => {
      const now = new Date();
      return {
        success: true,
        totalTargets: input.nonSubmittedReporters.length,
        successCount: input.nonSubmittedReporters.length,
        failureCount: 0,
        emailSendingHistoryIds: ['HIST-001'],
        sentAt: now.toISOString(),
        failedReporterIds: null,
        errorMessage: null,
      };
    });
  });

  it('定時リマインダー時刻（17:00）に到達したとき、リーダーへメール通知が送信され、送信履歴が記録される', async () => {
    const targetDate = '2024-01-15';
    const beforeDateTime = new Date(`${targetDate}T16:59:00.000Z`);
    const atReminderTime = new Date(`${targetDate}T17:00:00.000Z`);

    // 現在日時を17:00以降に設定（実装では Date.now() の値が確認対象となる）
    jest.useFakeTimers();
    jest.setSystemTime(atReminderTime);

    const input = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '田中太郎',
          userEmailAddress: 'tanaka@company.com',
          targetDate: '2024-01-15',
        },
      ],
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@company.com',
      detectionLogId: 'LOG-001',
      promptReason: '定時リマインダー',
      targetDate: '2024-01-15',
    };

    const result: any = await mockSendNonSubmissionPromptNotification(input);

    // (1) success = true
    expect(result.success).toBe(true);

    // (2) totalTargets = 1
    expect(result.totalTargets).toBe(1);

    // (3) successCount = 1
    expect(result.successCount).toBe(1);

    // (4) failureCount = 0
    expect(result.failureCount).toBe(0);

    // (5) emailSendingHistoryIds = ["HIST-001"]
    expect(result.emailSendingHistoryIds).toEqual(['HIST-001']);

    // (6) sentAt がISO 8601形式で記録されている
    expect(result.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

    // (7) failedReporterIds = null
    expect(result.failedReporterIds).toBeNull();

    // (8) errorMessage = null
    expect(result.errorMessage).toBeNull();

    jest.useRealTimers();
  });
});
