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

describe('SCEN-501: 有効なリーダーメールアドレスに対してメール通知の全検証が成功する', () => {
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

    // buildNotificationContent をスタブ化：指定のメール本文を返す
    // @ts-ignore
    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
    });

    // recordEmailSendingHistory をスタブ化：正常な記録応答を返す
    // @ts-ignore
    mockRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-20240115-001',
      recordedAt: '2024-01-15T14:30:15Z',
      errorMessage: null,
    });

    // sendDailyReportSubmissionNotification が成功を返すように設定
    // @ts-ignore
    mockSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-20240115-001',
      sentAt: '2024-01-15T14:30:15Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('有効なリーダーメールアドレスに対してメール送信が成功する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    // 実行
    // @ts-ignore
    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    // 戻り値の success フィールドが true であることを確認
    expect(result.success).toBe(true);

    // emailSendingHistoryId が正しい値であることを確認
    expect(result.emailSendingHistoryId).toBe('history-20240115-001');

    // sentAt が正しい値であることを確認
    expect(result.sentAt).toBe('2024-01-15T14:30:15Z');

    // errorMessage が null であることを確認
    expect(result.errorMessage).toBeNull();

    // adminNotificationSent が false であることを確認（エラーがないため管理者への通知は不要）
    expect(result.adminNotificationSent).toBe(false);

    // validateEmailAddressForDelivery が leaderEmailAddress='leader@example.com' で1回呼び出されることを検証
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalledWith({
      emailAddress: 'leader@example.com',
      recipientType: 'leader',
    });
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalledTimes(1);

    // buildNotificationContent が正しいパラメータで1回呼び出されることを検証
    expect(mockBuildNotificationContent).toHaveBeenCalledWith({
      notificationType: 'daily_report_submission',
      reporterName: '山田太郎',
      reportDate: '2024-01-15',
      reportContent: '顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
    });
    expect(mockBuildNotificationContent).toHaveBeenCalledTimes(1);

    // recordEmailSendingHistory が正しいパラメータで1回呼び出されることを検証
    expect(mockRecordEmailSendingHistory).toHaveBeenCalledWith({
      userId: 'leader-001',
      emailType: 'daily_report_submission',
      recipientEmailAddress: 'leader@example.com',
      subject: '【日報】2024年01月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n顧客A社との打ち合わせを実施。要件定義書をレビューし、修正箇所を整理した。明日は修正対応を進める予定。',
      sentAt: '2024-01-15T14:30:15Z',
      sendingStatus: 'success',
      relatedDailyReportId: 'report-20240115-001',
    });
    expect(mockRecordEmailSendingHistory).toHaveBeenCalledTimes(1);
  });
});
