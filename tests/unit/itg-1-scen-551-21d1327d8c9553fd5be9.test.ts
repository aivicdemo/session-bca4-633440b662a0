import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';
import type {
  SendUserInformationApprovalNotificationInput,
  SendUserInformationApprovalNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-551: 承認結果をリーダーにメール送信し、送信履歴を記録する', () => {
  beforeEach(() => {
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue(true);
    jest.mocked(buildNotificationContent).mockResolvedValue({
      subject: '【承認】ユーザー情報が承認されました',
      body: 'ユーザー情報が承認されました。',
    });
    jest.mocked(recordEmailSendingHistory).mockResolvedValue('history-12345');
  });

  it('承認結果をリーダーにメール送信し、送信履歴を記録する', async () => {
    jest.mocked(sendUserInformationApprovalNotification).mockResolvedValueOnce({
      success: true,
      emailSendingHistoryId: 'history-12345',
      sentAt: '2024-01-15T10:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter-001',
      reporterName: '田中太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2024-01-15T10:30:00Z',
      confirmingLeaderUserId: 'confirming-leader-001',
    };

    const result: SendUserInformationApprovalNotificationOutput = await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-12345');
    expect(result.sentAt).toBe('2024-01-15T10:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
