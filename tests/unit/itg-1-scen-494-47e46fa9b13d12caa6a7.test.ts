import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-494: メールアドレスが登録されていない場合の検証失敗処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail validation when leaderEmailAddress is empty string', async () => {
    // 入力値を準備
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客対応を実施。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '', // 空文字列（登録されていない状態）
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    // validateEmailAddressForDelivery をモック化し、空文字列で失敗を返す
    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // 検証失敗時の出力値を確認
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // LeaderEmailAddressNotFoundError がスローされる場合
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect(error.message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });

  it('should confirm validateEmailAddressForDelivery is called and returns false for empty address', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客対応を実施。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラー発生を期待
    }

    // validateEmailAddressForDelivery が呼び出されたことを確認
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalled();
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: '' })
    );
  });

  it('should verify business rule br-tx_1-004 constraint for unregistered email', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客対応を実施。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '田中太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    try {
      const result = await sendDailyReportSubmissionNotification(input);
      // 業務ルール br-tx_1-004 の制約『リーダーのメールアドレスが登録されていないとき』に該当
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
    }
  });
});
