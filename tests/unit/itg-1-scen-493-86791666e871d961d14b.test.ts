jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  ValidateEmailAddressForDeliveryOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;

describe('SCEN-493: リーダーメールアドレスが更新待ち状態の場合、警告が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('チームリーダーのメールアドレスの有効状態が『pending_update』（更新待ち）の場合、sendDailyReportSubmissionNotification は br-tx_2-008 の制約に従い、success=false、emailSendingHistoryId=null、sentAt=null、errorMessage=『メールアドレス更新が保留中です。確認してください』、adminNotificationSent=true を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '顧客A社のシステム要件定義会議を実施。基本仕様書ドラフト作成完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@company.example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockValidateResult: ValidateEmailAddressForDeliveryOutput = {
      isValid: false,
      reason: 'メールアドレス更新が保留中です',
      errorCode: 'EMAIL_UPDATE_PENDING',
    };

    mockedValidateEmailAddressForDelivery.mockResolvedValue(mockValidateResult);

    const result: SendDailyReportSubmissionNotificationOutput = await sendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メールアドレス更新が保留中です。確認してください');
    expect(result.adminNotificationSent).toBe(true);
  });
});
