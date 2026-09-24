jest.mock('../../src/logic/email-notification-management', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
}));

import {
  sendUserInformationApprovalNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  EmailSendingFailureError,
  EmailSendingPermanentFailureError,
  type SendUserInformationApprovalNotificationInput,
  type SendUserInformationApprovalNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-558: メール送信に失敗した場合、送信履歴レコードのIDはnullで返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'leader@example.com',
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: 'ユーザー情報承認通知',
      body: '山田太郎さんのユーザー情報が承認されました。',
      notificationType: 'user_information_approval',
    });

    mockedRecordEmailSendingHistory.mockResolvedValue(null);
  });

  it('メール送信がEmailSendingFailureErrorで失敗した場合、再試行案内のエラーメッセージで返される', async () => {
    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter001',
      reporterName: '山田太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2024-01-15T10:30:00Z',
      confirmingLeaderUserId: 'confirming-leader001',
    };

    const mockEmailServiceError = new EmailSendingFailureError(
      'メール送信サービスが一時的に利用不可'
    );

    // メール送信エラーが発生する前に実際のメール送信が試行されると仮定
    // ここでは recordEmailSendingHistory の挙動を設定
    mockedRecordEmailSendingHistory.mockRejectedValueOnce(mockEmailServiceError);

    const result: SendUserInformationApprovalNotificationOutput =
      await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。後で再試行してください。');
    expect(result.adminNotificationSent).toBe(true);
  });

  it('メール送信がEmailSendingPermanentFailureErrorで失敗した場合、管理者通知案内のエラーメッセージで返される', async () => {
    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader001',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter001',
      reporterName: '山田太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2024-01-15T10:30:00Z',
      confirmingLeaderUserId: 'confirming-leader001',
    };

    const mockEmailServiceError = new EmailSendingPermanentFailureError(
      'メールアドレスが無効'
    );

    mockedRecordEmailSendingHistory.mockRejectedValueOnce(mockEmailServiceError);

    const result: SendUserInformationApprovalNotificationOutput =
      await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知してください。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
