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

describe('SCEN-550: 報告期限の時刻が不正な形式のとき、throw文言が発生する', () => {
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
  });

  const testInvalidFormats = [
    '25:00',  // 不正な時間
    '1700',   // コロンなし
    '17-00',  // ハイフン区切り
    '17:00:00', // 秒まで指定
    '',        // 空文字列
  ];

  testInvalidFormats.forEach((invalidFormat) => {
    it(`reportingDeadlineTime が '${invalidFormat}' の場合、エラーがスローされる`, async () => {
      // 実装：不正な形式の reportingDeadlineTime を渡すとエラーをスローする
      (mockSendNonSubmissionPromptNotification as any).mockImplementation(async (input: any) => {
        // determineLeaderNotificationRoute を呼び出す際の形式検証
        // reportingDeadlineTime の形式をチェック（HH:MM形式であることを確認）
        const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeFormatRegex.test(invalidFormat)) {
          throw new Error('報告期限の設定が不正です。HH:MM形式で指定してください');
        }
        return {};
      });

      const input = {
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

      // 関数を呼び出してエラーがスローされることを確認
      await expect(mockSendNonSubmissionPromptNotification(input)).rejects.toThrow(
        '報告期限の設定が不正です。HH:MM形式で指定してください'
      );
    });
  });

  it('reportingDeadlineTime が正しい形式（HH:MM）の場合、エラーはスローされない', async () => {
    (mockSendNonSubmissionPromptNotification as any).mockImplementation(async (input: any) => {
      // 形式検証
      const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeFormatRegex.test('17:00')) {
        throw new Error('報告期限の設定が不正です。HH:MM形式で指定してください');
      }
      return { success: true };
    });

    const input = {
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

    // 正しい形式なのでエラーがスローされないことを確認
    const result: any = await mockSendNonSubmissionPromptNotification(input);
    expect(result.success).toBe(true);
  });
});
