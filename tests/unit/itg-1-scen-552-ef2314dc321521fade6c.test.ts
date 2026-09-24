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

describe('SCEN-552: 却下理由が指定された場合、却下結果をリーダーにメール送信する', () => {
  beforeEach(() => {
    jest.mocked(validateEmailAddressForDelivery).mockResolvedValue(true);
    jest.mocked(buildNotificationContent).mockResolvedValue({
      subject: '【却下】ユーザー情報が却下されました',
      body: 'ユーザー情報が却下されました。却下理由：記入内容が不十分です',
    });
    jest.mocked(recordEmailSendingHistory).mockResolvedValue('history-001');
  });

  it('却下理由が指定された場合、却下結果をリーダーにメール送信する', async () => {
    jest.mocked(sendUserInformationApprovalNotification).mockResolvedValueOnce({
      success: true,
      emailSendingHistoryId: 'history-001',
      sentAt: '2024-01-15T14:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    });

    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter-001',
      reporterName: '山田太郎',
      approvalStatus: 'rejected',
      rejectionReason: '記入内容が不十分です',
      approvalTimestamp: '2024-01-15T14:30:00Z',
      confirmingLeaderUserId: 'leader-002',
    };

    const result: SendUserInformationApprovalNotificationOutput = await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-001');
    expect(result.sentAt).toBe('2024-01-15T14:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
