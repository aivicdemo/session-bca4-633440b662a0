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
  type SendUserInformationApprovalNotificationInput,
  type SendUserInformationApprovalNotificationOutput,
} from '../../src/logic/email-notification-management';

const mockedValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.Mock;
const mockedBuildNotificationContent = buildNotificationContent as jest.Mock;
const mockedRecordEmailSendingHistory = recordEmailSendingHistory as jest.Mock;

describe('SCEN-557: メール送信に成功した場合、送信履歴レコードのIDと送信日時が返される', () => {
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

    mockedRecordEmailSendingHistory.mockResolvedValue({
      emailSendingHistoryId: 'history-xxxx',
      sentAt: '2025-01-15T10:30:00Z',
      recordingStatus: 'recorded',
    });
  });

  it('入力値から通知内容を構築し、メール送信に成功し、送信履歴レコードのIDと送信日時が返される', async () => {
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

    const result: SendUserInformationApprovalNotificationOutput =
      await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-xxxx');
    expect(result.sentAt).toBe('2025-01-15T10:30:00Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    expect(mockedValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'leader@example.com' })
    );
    expect(mockedBuildNotificationContent).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: '山田太郎',
        approvalStatus: 'approved',
      })
    );
    expect(mockedRecordEmailSendingHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        leaderEmailAddress: 'leader@example.com',
      })
    );
  });
});
