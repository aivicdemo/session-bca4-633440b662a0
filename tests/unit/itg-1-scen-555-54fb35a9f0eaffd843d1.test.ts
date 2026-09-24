import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  validateEmailAddressForDelivery,
  EmailSendingFailureError,
} from '../../src/logic/email-notification-management';
import type {
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-555: メール送信サービスが一時的に利用不可の場合、EmailSendingFailureErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信サービスが503エラーで利用不可の場合、EmailSendingFailureErrorが発生する', async () => {
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue(true);

    jest.mocked(sendUserInformationApprovalNotification).mockImplementation(async () => {
      throw new EmailSendingFailureError(
        'メール送信に失敗しました。後で再試行してください。'
      );
    });

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

    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      EmailSendingFailureError
    );
    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      'メール送信に失敗しました。後で再試行してください。'
    );
  });
});
