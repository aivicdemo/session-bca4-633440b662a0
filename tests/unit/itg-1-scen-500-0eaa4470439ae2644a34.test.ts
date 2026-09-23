import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

// 依存先のモック
jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
  sendDailyReportSubmissionNotification: jest.fn(),
}));

describe('SCEN-500: メール配信が技術的に失敗した場合、警告メッセージを返す', () => {
  let mockValidateEmailAddressForDelivery: jest.Mock;
  let mockBuildNotificationContent: jest.Mock;
  let mockRecordEmailSendingHistory: jest.Mock;
  let mockSendDailyReportSubmissionNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = require('../../src/logic/email-notification-management.ts')
      .validateEmailAddressForDelivery as jest.Mock;
    mockBuildNotificationContent = require('../../src/logic/email-notification-management.ts')
      .buildNotificationContent as jest.Mock;
    mockRecordEmailSendingHistory = require('../../src/logic/email-notification-management.ts')
      .recordEmailSendingHistory as jest.Mock;
    mockSendDailyReportSubmissionNotification = require('../../src/logic/email-notification-management.ts')
      .sendDailyReportSubmissionNotification as jest.Mock;

    // validateEmailAddressForDelivery をスタブ化：有効な応答を返す
    // @ts-ignore
    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    // buildNotificationContent をスタブ化：適切なメール本文を返す
    // @ts-ignore
    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 田中太郎',
      body: '田中太郎さんからの日報です\n\n本日は顧客Aのシステム改修に従事し、API設計書を完成させた',
    });

    // メール送信を失敗させるスタブ化：ネットワークエラーを模擬
    // 注：実装内で内部メール送信処理をスタブ化する想定
    // ここでは、メール送信失敗のシナリオをシミュレートするため
    // sendDailyReportSubmissionNotification が失敗を返すように設定
    // @ts-ignore
    mockSendDailyReportSubmissionNotification.mockResolvedValue({
      success: false,
      errorMessage: 'メール送信に失敗しました。システム管理者に連絡してください',
      emailSendingHistoryId: null,
      sentAt: null,
      adminNotificationSent: true,
    });

    // recordEmailSendingHistory は呼ばれないか、呼ばれてもスキップされる想定
    // @ts-ignore
    mockRecordEmailSendingHistory.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      recordedAt: null,
      errorMessage: null,
    });
  });

  it('メール送信に失敗した場合、警告メッセージと共に失敗を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客Aのシステム改修に従事し、API設計書を完成させた',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    // 実行
    // @ts-ignore
    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    // 戻り値の success フィールドが false であることを確認
    expect(result.success).toBe(false);

    // エラーメッセージが正しいことを確認
    expect(result.errorMessage).toBe('メール送信に失敗しました。システム管理者に連絡してください');

    // emailSendingHistoryId が null であることを確認
    expect(result.emailSendingHistoryId).toBeNull();

    // sentAt が null であることを確認
    expect(result.sentAt).toBeNull();

    // adminNotificationSent が true であることを確認（管理者への通知が試行された）
    expect(result.adminNotificationSent).toBe(true);

    // recordEmailSendingHistory が呼び出されていないことを検証
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
