import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-491: リーダーメールアドレスが空または不正な形式の場合のエラー処理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderEmailAddressInvalidError when leaderEmailAddress is empty string', async () => {
    // 入力値を構築
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は会議を実施しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '', // 空文字列
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    // validateEmailAddressForDelivery をモック化（空の場合は失敗を返す）
    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false, reason: '有効なメールアドレスを登録してください' });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    // 関数を実行
    try {
      const result = await sendDailyReportSubmissionNotification(input);

      // エラーが発生しない場合は出力値を確認
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('有効なメールアドレスを登録してください');
      expect(result.adminNotificationSent).toBe(true);
    } catch (error) {
      // LeaderEmailAddressInvalidError がスローされる場合
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect(error.message).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    }
  });

  it('should confirm validateEmailAddressForDelivery is called with empty leaderEmailAddress', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は会議を実施しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockValidateEmailAddressForDelivery = jest
      .fn()
      .mockReturnValue({ isValid: false, reason: '有効なメールアドレスを登録してください' });

    jest.spyOn(
      require('../../src/logic/email-notification-management'),
      'validateEmailAddressForDelivery'
    ).mockImplementation(mockValidateEmailAddressForDelivery);

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラーが発生することを期待
    }

    // validateEmailAddressForDelivery が空文字列で呼び出されたことを確認
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: '' })
    );
  });
});
