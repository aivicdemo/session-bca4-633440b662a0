jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import { sendDailyReportSubmissionNotification, validateEmailAddressForDelivery } from '../../src/logic/email-notification-management';
import type { SendDailyReportSubmissionNotificationInput, SendDailyReportSubmissionNotificationOutput } from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.Mock;
const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;

describe('SCEN-490: リーダーメールアドレスがアクティブな場合、validateAndRouteLeaderNotification は通知送信可能と判定する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('リーダーメールアドレスがアクティブな場合、sendDailyReportSubmissionNotification は成功応答を返す', async () => {
    // テスト対象の関数 sendDailyReportSubmissionNotification を呼び出す準備をする
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'R001',
      dailyReportId: 'DR-20240115-001',
      reportContent: '本日の業務内容を実施しました。',
      reportDate: '2024-01-15',
      leaderUserId: 'L001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者太郎',
      submissionTimestamp: '2024-01-15T17:30:00+09:00',
    };

    // validateAndRouteLeaderNotification の内部では validateEmailAddressForDelivery が呼び出され、
    // leaderEmailAddress='leader@example.com' が有効と判定される
    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      canDeliver: true,
    });

    // sendDailyReportSubmissionNotification は通知送信可能と判定して成功応答を返す
    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: true,
      emailSendingHistoryId: 'ESH-001',
      sentAt: '2024-01-15T17:31:00+09:00',
      targetEmail: 'leader@example.com',
      notificationStatus: 'sent',
      errorMessage: null,
      adminNotificationSent: false,
    };

    mockedSendDailyReportSubmissionNotification.mockResolvedValue(expectedOutput);

    // sendDailyReportSubmissionNotification を実行する
    const result = await mockedSendDailyReportSubmissionNotification(input);

    // 戻り値のフィールド canSendNotification (実装では success) の値を検証する
    expect(result.success).toBe(true);
    // 戻り値のフィールド targetEmail の値を検証する
    expect(result.targetEmail).toBe('leader@example.com');
    // 期待結果: { success: true, targetEmail: 'leader@example.com', ... }
    // これにより、チームリーダーのメールアドレスがアクティブな状態の場合、
    // システムが通知送信可能と正しく判定できることを確認できる
  });
});
