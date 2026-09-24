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
  EmailSendingPermanentFailureError,
  type SendUserInformationApprovalNotificationInput,
  type SendUserInformationApprovalNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-556: メール送信サービスが永続的に失敗した場合、EmailSendingPermanentFailureErrorが発生し管理者に通知される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: false,
      validatedEmailAddress: 'leader@example.com',
      validationError: 'メールアドレスが存在しない',
    });

    mockedBuildNotificationContent.mockResolvedValue({
      subject: 'ユーザー情報承認通知',
      body: '山田太郎さんのユーザー情報が承認されました。',
      notificationType: 'user_information_approval',
    });
  });

  it('外部メール送信サービスとの連携ポイントが永続的失敗をシミュレートし、管理者への通知機構が呼び出される', async () => {
    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter-001',
      reporterName: '山田太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2025-01-15T10:30:00Z',
      confirmingLeaderUserId: 'confirming-leader-001',
    };

    const permanentFailureError = new EmailSendingPermanentFailureError(
      'リーダーのメールアドレスが存在しない、送信制限超過に相当する状態'
    );

    mockedRecordEmailSendingHistory.mockRejectedValueOnce(permanentFailureError);

    const result: SendUserInformationApprovalNotificationOutput =
      await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知してください。');
    expect(result.adminNotificationSent).toBe(true);

    // 処理が呼び出し先を実行したことを検証
    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'leader@example.com' })
    );
    expect(mockedBuildNotificationContent).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: '山田太郎',
        approvalStatus: 'approved',
        approvalTimestamp: '2025-01-15T10:30:00Z',
      })
    );
    expect(mockedRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
