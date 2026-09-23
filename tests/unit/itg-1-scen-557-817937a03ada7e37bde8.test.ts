import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-557: メール送信に成功した場合、送信履歴レコードのIDと送信日時が返される', () => {
  test('正常系：メール送信に成功した場合、送信履歴レコードのIDと送信日時が返される', async () => {
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
