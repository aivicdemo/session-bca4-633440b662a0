import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';
import type { SendUserInformationApprovalNotificationInput, SendUserInformationApprovalNotificationOutput } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management.ts');

describe('SCEN-551: 承認結果をリーダーにメール送信し、送信履歴を記録する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mocked = jest.mocked(sendUserInformationApprovalNotification);
    mocked.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-12345',
      sentAt: '2024-01-15T10:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    });
  });

  it('承認結果をリーダーにメール送信し、送信履歴を記録する', async () => {
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
