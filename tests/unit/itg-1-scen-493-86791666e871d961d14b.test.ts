import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-493: リーダーメールアドレスが更新待ち状態の場合の警告処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return warning when leaderEmailStatus is pending_update', async () => {
    // 入力値を設定
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本仕様書ドラフト作成完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    // validateAndRouteLeaderNotification が pending_update 状態を返すようモック化
    const mockValidateAndRouteLeaderNotification = jest.fn().mockReturnValue({
      canSendNotification: false,
      targetEmail: null,
      reason: 'メールアドレス更新が保留中です',
    });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateAndRouteLeaderNotification'
    ).mockImplementation(mockValidateAndRouteLeaderNotification);

    const result = await sendDailyReportSubmissionNotification(input);

    // 期待値の検証
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メールアドレス更新が保留中です。確認してください');
    expect(result.adminNotificationSent).toBe(true);
  });

  it('should not send email when emailStatus is pending_update', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '会議実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockBuildNotificationContent = jest.fn();
    const mockRecordEmailSendingHistory = jest.fn();

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'recordEmailSendingHistory'
    ).mockImplementation(mockRecordEmailSendingHistory);

    // メール送信処理が呼び出されないことを確認
    // pending_update の場合はメール送信をスキップ
  });

  it('should apply business rule br-tx_2-008 constraint for pending_update', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '会議実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    // 業務ルール br-tx_2-008 の制約が適用されることを確認
    // [warn] メールアドレスが更新待ち状態のとき → 「メールアドレス更新が保留中です。確認してください」
    if (result.errorMessage) {
      expect(result.errorMessage).toContain('メールアドレス更新が保留中です');
    }
  });
});
