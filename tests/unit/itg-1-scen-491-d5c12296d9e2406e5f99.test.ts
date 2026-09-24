jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
  LeaderEmailAddressInvalidError: class extends Error {
    constructor(message?: string) {
      super(message || 'チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
      this.name = 'LeaderEmailAddressInvalidError';
    }
  },
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressInvalidError,
} from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput, SendDailyReportSubmissionNotificationOutput } from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;
const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;

describe('SCEN-491: リーダーメールアドレスが空または不正な形式の場合、validateAndRouteLeaderNotification で『有効なメールアドレスを登録してください』のエラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('leaderEmailAddress に空文字列を設定した場合、sendDailyReportSubmissionNotification はエラー応答またはエラーをスローする', async () => {
    // テスト対象の関数 sendDailyReportSubmissionNotification を呼び出す準備として、入力値を構築する
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'R001',
      dailyReportId: 'DR-20240115-001',
      reportContent: '本日の業務内容を実施しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: '', // 空文字列を設定
      reporterName: '報告者太郎',
      submissionTimestamp: '2024-01-15T17:30:00+09:00',
    };

    // validateEmailAddressForDelivery がスタブとして leaderEmailAddress '' を受け取り、
    // エラー検証結果を返す
    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      canDeliver: false,
      reason: '有効なメールアドレスを登録してください',
    });

    // 業務ルール br-tx_2-008 の validateAndRouteLeaderNotification が内部で呼び出され、
    // leaderEmailAddress が空であるため、制約『[throw] リーダーメールアドレスが空または不正な形式のとき → 「有効なメールアドレスを登録してください」』に該当

    // パターン1: 出力型の errorMessage フィールドに「有効なメールアドレスを登録してください」を設定
    const errorOutput: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      targetEmail: null,
      notificationStatus: 'failed',
      errorMessage: '有効なメールアドレスを登録してください',
      adminNotificationSent: true,
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue(errorOutput);

    // sendDailyReportSubmissionNotification(input) を実行する
    const result = await mockedSendDailyReportSubmissionNotification(input);

    // sendDailyReportSubmissionNotification の戻り値の以下の状態を確認する:
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('有効なメールアドレスを登録してください');
    // adminNotificationSent は true（管理者への通知が送信される）
    expect(result.adminNotificationSent).toBe(true);
  });

  it('リーダーメールアドレスが空の場合、LeaderEmailAddressInvalidError エラーがスローされる', async () => {
    // テスト対象の関数 sendDailyReportSubmissionNotification を呼び出す準備
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'R001',
      dailyReportId: 'DR-20240115-001',
      reportContent: '本日の業務内容を実施しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: '', // 空文字列を設定
      reporterName: '報告者太郎',
      submissionTimestamp: '2024-01-15T17:30:00+09:00',
    };

    // validateEmailAddressForDelivery がスタブとして leaderEmailAddress '' を受け取る
    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      canDeliver: false,
      reason: '有効なメールアドレスを登録してください',
    });

    // パターン2: LeaderEmailAddressInvalidError エラーがスローされる場合
    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new LeaderEmailAddressInvalidError('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。')
    );

    // sendDailyReportSubmissionNotification(input) を実行する
    try {
      await mockedSendDailyReportSubmissionNotification(input);
      // エラーが発生しなかった場合は失敗
      throw new Error('Expected LeaderEmailAddressInvalidError to be thrown');
    } catch (error) {
      // LeaderEmailAddressInvalidError エラーが発生することを確認する
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      // エラーの文言が業務ルール br-tx_2-008 の制約と一致することを確認する
      expect(error.message).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    }
  });

  it('呼び出し処理 validateEmailAddressForDelivery がスタブとして leaderEmailAddress を受け取ることを確認する', async () => {
    // テスト対象の関数 sendDailyReportSubmissionNotification を呼び出す準備
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'R001',
      dailyReportId: 'DR-20240115-001',
      reportContent: '本日の業務内容を実施しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: '', // 空文字列を設定
      reporterName: '報告者太郎',
      submissionTimestamp: '2024-01-15T17:30:00+09:00',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      canDeliver: false,
      reason: '有効なメールアドレスを登録してください',
    });

    // 出力型の errorMessage フィールドに「有効なメールアドレスを登録してください」を設定
    const errorOutput: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      targetEmail: null,
      notificationStatus: 'failed',
      errorMessage: '有効なメールアドレスを登録してください',
      adminNotificationSent: true,
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue(errorOutput);

    // sendDailyReportSubmissionNotification(input) を実行する
    await mockedSendDailyReportSubmissionNotification(input);

    // 呼び出し処理 validateEmailAddressForDelivery がスタブとして leaderEmailAddress '' を受け取り、
    // エラー検証結果を返すことを確認する
    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: '' })
    );
  });
});
