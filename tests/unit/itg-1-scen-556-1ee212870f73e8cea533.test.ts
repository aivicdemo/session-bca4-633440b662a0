import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  EmailSendingPermanentFailureError,
} from '../../src/logic/email-notification-management';
import type { SendUserInformationApprovalNotificationInput } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

const mockSendUserInformationApprovalNotification = sendUserInformationApprovalNotification as jest.MockedFunction<
  typeof sendUserInformationApprovalNotification
>;

describe('SCEN-556: メール送信サービスが永続的に失敗した場合、EmailSendingPermanentFailureErrorが発生し管理者に通知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信サービスが永続的失敗を返した場合、管理者への通知が送信される', async () => {
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

    mockSendUserInformationApprovalNotification.mockRejectedValueOnce(
      new EmailSendingPermanentFailureError(
        'メール送信に失敗しました。管理者に通知してください。',
      ),
    );

    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      EmailSendingPermanentFailureError,
    );

    try {
      await sendUserInformationApprovalNotification(input);
      fail('Expected EmailSendingPermanentFailureError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingPermanentFailureError);
      if (error instanceof EmailSendingPermanentFailureError) {
        expect(error.message).toBe('メール送信に失敗しました。管理者に通知してください。');
      }
    }
  });
});
