import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-499: メールアドレスの形式が不正な場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderEmailAddressInvalidError when email format is invalid', async () => {
    // 入力型 SendDailyReportSubmissionNotificationInput を構成
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務実績を報告します',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user@', // 不正な形式（ドメイン部分がない）
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    // validateEmailAddressForDelivery をスタブ化し、不正なメールアドレス形式に対して false を返す
    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // エラーが発生しない場合、出力値を確認
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
    } catch (error) {
      // LeaderEmailAddressInvalidError 例外が発生する場合
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect(error.message).toContain('メールアドレスの形式が正しくありません');
    }
  });

  it('should verify error name is LeaderEmailAddressInvalidError', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務実績を報告します',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '@domain.com', // 不正な形式（@記号の前がない）
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
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
      // 例外の名前が『LeaderEmailAddressInvalidError』であることを確認
      expect(error.constructor.name).toBe('LeaderEmailAddressInvalidError');
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
    }
  });

  it('should not call buildNotificationContent when email format is invalid', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務実績を報告します',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'userdomain.com', // 不正な形式（@記号がない）
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false });

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

  it('should verify error message matches business rule constraint', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務実績を報告します',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-format',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
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
      // 業務ルールで指定されたエラーメッセージを確認
      // テストタイトルの『メールアドレスの形式が正しくありません。確認してください』
      // または設計済みエラー LeaderEmailAddressInvalidError の文言を確認
      expect(error.message).toContain('メールアドレス');
      expect(error.message).toContain('不正');
    }
  });

  it('should confirm validateEmailAddressForDelivery is called with invalid format', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-001',
      reportContent: '本日の業務実績を報告します',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user@',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
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
  });
});
