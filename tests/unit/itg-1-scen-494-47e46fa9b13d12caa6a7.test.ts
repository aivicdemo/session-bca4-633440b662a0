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

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;

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
      errorCode: 'LEADER_EMAIL_NOT_FOUND',
    });

    const result = await sendDailyReportSubmissionNotification(input);

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith({
      emailAddress: '',
      recipientType: 'leader',
    });
    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });

  it('業務ルール br-tx_1-004 の制約「リーダーのメールアドレスが登録されていないとき → 『リーダーのメールアドレスを設定してください』」に該当する条件であることを確認する', async () => {
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
      errorCode: 'LEADER_EMAIL_NOT_FOUND',
    });

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
  });

  it('戻り値は success=false、emailSendingHistoryId=null、sentAt=null、errorMessage=『チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。』、adminNotificationSent=true となる', async () => {
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
      errorCode: 'LEADER_EMAIL_NOT_FOUND',
    });

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
