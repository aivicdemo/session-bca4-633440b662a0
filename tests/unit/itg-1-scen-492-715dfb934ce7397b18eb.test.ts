jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  LeaderEmailAddressNotFoundError,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;

describe('SCEN-492: リーダーメールアドレスが登録されていない場合、LeaderEmailAddressNotFoundError が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('leaderEmailAddress に空文字列を設定した場合、LeaderEmailAddressNotFoundError エラーが発生し、エラーメッセージが『チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。』である', async () => {
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
      reason: 'リーダーメールアドレスの登録が必要です',
    });

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );
  });

  it('leaderEmailAddress に null を設定した場合も同様にエラーが発生する', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本仕様書ドラフト作成完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: null as any,
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      reason: 'リーダーメールアドレスの登録が必要です',
    });

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      LeaderEmailAddressNotFoundError
    );
  });

  it('エラーメッセージが『チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。』である', async () => {
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
      reason: 'リーダーメールアドレスの登録が必要です',
    });

    try {
      await sendDailyReportSubmissionNotification(input);
      fail('Expected LeaderEmailAddressNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderEmailAddressNotFoundError);
      expect((error as Error).message).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    }
  });
});
