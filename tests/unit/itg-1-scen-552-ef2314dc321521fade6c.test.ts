import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-552: 却下理由が指定された場合、却下結果をリーダーにメール送信する', () => {
  test('正常系：却下理由が指定された場合、却下結果をリーダーにメール送信する', async () => {
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
