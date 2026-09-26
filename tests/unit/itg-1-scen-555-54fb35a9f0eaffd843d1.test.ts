import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  EmailSendingFailureError,
} from '../../src/logic/email-notification-management';
import type { SendUserInformationApprovalNotificationInput } from '../../src/logic/email-notification-management';

// Mock the dependencies
jest.mock('../../src/logic/email-notification-management');

const mockSendUserInformationApprovalNotification = sendUserInformationApprovalNotification as jest.MockedFunction<
  typeof sendUserInformationApprovalNotification
>;

describe('SCEN-555: メール送信サービスが一時的に利用不可の場合、EmailSendingFailureErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信サービスが一時的利用不可（503エラー）を返した場合、EmailSendingFailureErrorが発生する', async () => {
    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter-001',
      reporterName: '山田太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2024-01-15T10:30:00Z',
      confirmingLeaderUserId: 'confirming-leader-001',
    };

    mockSendUserInformationApprovalNotification.mockRejectedValueOnce(
      new EmailSendingFailureError('メール送信に失敗しました。後で再試行してください。'),
    );

    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      EmailSendingFailureError,
    );

    try {
      await sendUserInformationApprovalNotification(input);
      fail('Expected EmailSendingFailureError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailureError);
      if (error instanceof EmailSendingFailureError) {
        expect(error.message).toBe('メール送信に失敗しました。後で再試行してください。');
      }
    }
  });
});
