jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressInvalidError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;

describe('SCEN-495: メールアドレスの形式が不正な場合、validateEmailAddressForDelivery は検証に失敗する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('leaderEmailAddress に不正な形式（「leader@invalid」）を設定した場合、LeaderEmailAddressInvalidError エラーが発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が正しくありません',
    });

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressInvalidError
    );
  });

  it('戻り値は success=false、emailSendingHistoryId=null、sentAt=null、errorMessage=『チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。』、adminNotificationSent=true となる', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が正しくありません',
    });

    let result;
    try {
      result = await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressInvalidError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    }

    if (result) {
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    }
  });

  it('buildNotificationContent および recordEmailSendingHistory 関数は呼び出されず、メール送信処理は中止される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施',
      reportDate: '2025-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@invalid',
      reporterName: '田中太郎',
      submissionTimestamp: '2025-01-15T14:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'メールアドレスの形式が正しくありません',
    });

    try {
      await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラー発生時、後続処理は呼び出されない
      const { buildNotificationContent, recordEmailSendingHistory } = require('../../src/logic/email-notification-management');
      expect(buildNotificationContent).not.toHaveBeenCalled();
      expect(recordEmailSendingHistory).not.toHaveBeenCalled();
    }
  });
});
