import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-495: メールアドレスの形式が不正な場合の検証失敗処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when email format is invalid', async () => {
    // 入力値を構築
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z' as any,
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid', // @記号はあるがドメイン部分が無効な形式
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    // validateEmailAddressForDelivery をスタブ化し、形式検証エラーを返す
    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false, reason: 'メールアドレスの形式が正しくありません' });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // エラーが発生しない場合は出力値を確認
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // LeaderEmailAddressInvalidError がスローされる場合
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect(error.message).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    }
  });

  it('should confirm buildNotificationContent is not called when email format is invalid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z' as any,
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false, reason: 'メールアドレスの形式が正しくありません' });

    const mockBuildNotificationContent = jest.fn();
    const mockRecordEmailSendingHistory = jest.fn();

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'buildNotificationContent'
    ).mockImplementation(mockBuildNotificationContent);

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'recordEmailSendingHistory'
    ).mockImplementation(mockRecordEmailSendingHistory);

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラー発生を期待
    }

    // buildNotificationContent と recordEmailSendingHistory が呼び出されないことを確認
    expect(mockBuildNotificationContent).not.toHaveBeenCalled();
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });

  it('should verify LeaderEmailAddressInvalidError with proper message', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z' as any,
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email-format',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
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
      expect(result.errorMessage).toContain('無効');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
    }
  });
});
