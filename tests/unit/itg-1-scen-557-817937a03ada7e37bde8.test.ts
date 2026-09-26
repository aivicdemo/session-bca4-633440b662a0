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

describe('SCEN-557: メール送信に成功した場合、送信履歴レコードのIDと送信日時が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メール送信に成功した場合、送信履歴レコードのIDと送信日時が返される', async () => {
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

    const expectedOutput: SendUserInformationApprovalNotificationOutput = {
      success: true,
      emailSendingHistoryId: 'history-xxxx',
      sentAt: '2025-01-15T10:30:00Z',
      errorMessage: null,
      adminNotificationSent: false,
    };

    mockSendUserInformationApprovalNotification.mockResolvedValueOnce(expectedOutput);

    const result = await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-xxxx');
    expect(result.sentAt).toBe('2025-01-15T10:30:00Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });
});
