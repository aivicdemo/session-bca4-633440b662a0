import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  SendUserInformationApprovalNotificationInput,
  SendUserInformationApprovalNotificationOutput,
} from '../../src/logic/email-notification-management';

describe('SCEN-551: 承認結果をリーダーにメール送信し、送信履歴を記録する', () => {
  test('正常系：承認結果をリーダーにメール送信し、送信履歴を記録する', async () => {
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

    const result = await sendUserInformationApprovalNotification(input);

    expect(result).toBeDefined();
    expect(result).toMatchObject({
      success: expect.any(Boolean),
      emailSendingHistoryId: expect.anything(),
      sentAt: expect.anything(),
      errorMessage: expect.anything(),
      adminNotificationSent: expect.any(Boolean),
    });
  });
});
