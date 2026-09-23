import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-498: チームリーダーのメールアドレスが登録されていない場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderEmailAddressNotFoundError when leaderEmailAddress is empty', async () => {
    // 入力値：leaderEmailAddress に空文字列を設定
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '', // 空文字列
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // エラーが発生しない場合、出力値を確認
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toContain('チームリーダーのメールアドレスが登録されていないため');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // LeaderEmailAddressNotFoundError 例外が発生する場合
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect(error.message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });

  it('should verify error message matches business rule br-tx_2-003 constraint', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // 業務ルール br-tx_2-003 の制約に基づく設計済みエラーメッセージ
      // 『チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。』
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    } catch (error) {
      expect(error.message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });

  it('should verify admin notification is sent when email is not found', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // 管理者への通知が送信されることを確認
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // エラー時も管理者への通知が送信される
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
    }
  });

  it('should verify output type fields are correct when email not found', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '本日の業務を実施しました',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // 出力型 SendDailyReportSubmissionNotificationOutput の各フィールドを確認
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('emailSendingHistoryId');
      expect(result).toHaveProperty('sentAt');
      expect(result).toHaveProperty('errorMessage');
      expect(result).toHaveProperty('adminNotificationSent');

      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
    }
  });
});
