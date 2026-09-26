import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
} from '../../src/logic/email-notification-management';
import type {
  SendUserInformationApprovalNotificationInput,
  SendUserInformationApprovalNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

const mockSendUserInformationApprovalNotification = sendUserInformationApprovalNotification as jest.MockedFunction<
  typeof sendUserInformationApprovalNotification
>;

describe('SCEN-558: メール送信に失敗した場合、送信履歴レコードのIDはnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    const failureOutput: SendUserInformationApprovalNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。後で再試行してください。',
      adminNotificationSent: true,
    };

    mockSendUserInformationApprovalNotification.mockResolvedValueOnce(failureOutput);

    const result = await sendUserInformationApprovalNotification(input);

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

    const permanentFailureOutput: SendUserInformationApprovalNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'メール送信に失敗しました。管理者に通知してください。',
      adminNotificationSent: true,
    };

    mockSendUserInformationApprovalNotification.mockResolvedValueOnce(permanentFailureOutput);

    const result = await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(false);
    expect(result.emailSendingHistoryId).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知してください。');
    expect(result.adminNotificationSent).toBe(true);
  });
});
