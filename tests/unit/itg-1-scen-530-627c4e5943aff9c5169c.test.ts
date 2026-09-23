import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';

describe('SCEN-530: submissionTimestamp が ISO 8601形式でない場合、処理の動作を確認する', () => {
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

  it('submissionTimestamp が ISO 8601形式でない場合（例：2024-01-15 10:30:00）、処理は形式検証に失敗し success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024-01-15', // ISO 8601形式（有効）
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15 10:30:00', // スペース区切りは ISO 8601 形式ではない
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('submissionTimestamp');
    expect(result.adminNotificationSent).toBe(true);

    // buildNotificationContent、validateEmailAddressForDelivery、recordEmailSendingHistory は呼び出されない
    expect(jest.mocked(buildNotificationContent)).not.toHaveBeenCalled();
    expect(jest.mocked(validateEmailAddressForDelivery)).not.toHaveBeenCalled();
    expect(jest.mocked(recordEmailSendingHistory)).not.toHaveBeenCalled();
  });

  it('submissionTimestamp が ISO 8601形式でない場合（例：invalid-date）、処理は形式検証に失敗し success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: 'invalid-date', // 無効な日時文字列
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBeDefined();
    expect(result.adminNotificationSent).toBe(true);
  });

  it('submissionTimestamp が ISO 8601形式でない場合（例：空文字列）、処理は形式検証に失敗し success=false を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: '', // 空文字列
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBeDefined();
    expect(result.adminNotificationSent).toBe(true);
  });

  it('submissionTimestamp が ISO 8601形式でない場合（例：null）、処理は形式検証に失敗し success=false を返す', async () => {
    const input: any = {
      reporterId: 'valid-reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日は顧客との打ち合わせを実施。契約内容を確認した。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '田中太郎',
      submissionTimestamp: null, // null値
    };

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBeDefined();
    expect(result.adminNotificationSent).toBe(true);
  });
});
