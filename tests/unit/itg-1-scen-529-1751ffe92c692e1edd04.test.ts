import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

describe('SCEN-529: reportDate が ISO 8601形式でない場合、処理の動作を確認する', () => {
  beforeEach(() => {
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue(true);
    jest.mocked(buildNotificationContent).mockResolvedValue({
      subject: 'テスト件名',
      body: 'テスト本文',
    });
    jest.mocked(recordEmailSendingHistory).mockResolvedValue({
      emailSendingHistoryId: 'history-001',
      recordedAt: '2024-01-15T10:30:00Z',
    });
  });

  it('reportDate が ISO 8601形式でない場合（例：2024-13-45）、処理は形式検証で失敗し success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024-13-45', // 無効な日付形式
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    // メール送信に進まないことを確認
    expect(jest.mocked(validateEmailAddressForDelivery)).not.toHaveBeenCalled();
    expect(jest.mocked(buildNotificationContent)).not.toHaveBeenCalled();
    expect(jest.mocked(recordEmailSendingHistory)).not.toHaveBeenCalled();
  });

  it('reportDate が ISO 8601形式でない場合（例：2024/01/15）、処理は形式検証で失敗し success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024/01/15', // スラッシュ区切りは ISO 8601 形式ではない
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('reportDate が ISO 8601形式でない場合（例：invalid-date）、処理は形式検証で失敗し success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: 'invalid-date', // 無効な日付文字列
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('reportDate が ISO 8601形式でない場合（例：空文字列）、処理は形式検証で失敗し success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '', // 空文字列
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
