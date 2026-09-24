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

describe('SCEN-494: メールアドレスが登録されていない場合、validateEmailAddressForDelivery は検証に失敗する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('leaderEmailAddress に空文字列を設定した場合、validateEmailAddressForDelivery は検証に失敗を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本仕様書ドラフト作成完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'リーダーのメールアドレスを設定してください',
    });

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalled();
  });

  it('業務ルール br-tx_1-004 の制約に該当する条件であることを確認する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本仕様書ドラフト作成完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'リーダーのメールアドレスを設定してください',
    });

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected LeaderEmailAddressNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });

  it('戻り値は success=false、errorMessage=『チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。』、adminNotificationSent=true となる', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本仕様書ドラフト作成完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'リーダーのメールアドレスを設定してください',
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
      expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
      expect(result.adminNotificationSent).toBe(true);
    }
  });
});
