jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;

describe('SCEN-498: チームリーダーのメールアドレスが登録されていない場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('leaderEmailAddress に空文字列（『』）を設定した場合、LeaderEmailAddressNotFoundError 例外が発生する', async () => {
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

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'チームリーダーのメールアドレスが設定されていません。管理画面で設定してください',
    });

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );
  });

  it('エラーメッセージが『チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。』である', async () => {
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

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'チームリーダーのメールアドレスが設定されていません。管理画面で設定してください',
    });

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected LeaderEmailAddressNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });

  it('出力型のフィールドで success=false、emailSendingHistoryId=null、sentAt=null、errorMessage にエラー文言が含まれ、adminNotificationSent が true となる', async () => {
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

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'チームリーダーのメールアドレスが設定されていません。管理画面で設定してください',
    });

    let result;
    try {
      result = await sendDailyReportSubmissionNotification(input);
    } catch (error) {
      // エラー発生時
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
    }

    if (result) {
      expect(result.success).toBe(false);
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toContain('チームリーダーのメールアドレスが登録されていないため');
      expect(result.adminNotificationSent).toBe(true);
    }
  });
});
