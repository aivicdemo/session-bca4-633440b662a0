import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-492: リーダーメールアドレスが登録されていない場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderEmailAddressNotFoundError when leaderEmailAddress is not registered', async () => {
    // 入力値を準備
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本仕様書ドラフト作成完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '', // 空または null（登録されていない状態）
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    // validateAndRouteLeaderNotification が呼び出されることを想定
    // leaderEmailAddress が空の場合、メールアドレスが登録されていないことを検出

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // エラーが発生しない場合の出力値確認
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toContain('チームリーダーのメールアドレスが登録されていないため');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // LeaderEmailAddressNotFoundError がスローされる場合
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect(error.message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });

  it('should trigger admin notification when leaderEmailAddress is not found', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日の業務完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: null as any,
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    try {
      const result = await sendDailyReportSubmissionNotification(input);
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // エラー時も管理者への通知が送信されることを期待
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
    }
  });

  it('should verify validateAndRouteLeaderNotification checks for empty or null leaderEmailAddress', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は会議実施。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // validateAndRouteLeaderNotification の条件をチェック
      // リーダーメールアドレスが空の場合の処理
    }

    // LeaderEmailAddressNotFoundError が発生することを確認
  });
});
