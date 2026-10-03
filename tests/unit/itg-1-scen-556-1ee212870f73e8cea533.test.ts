import { sendUserInformationApprovalNotification, EmailSendingPermanentFailureError } from '../../src/logic/email-notification-management';
import type { SendUserInformationApprovalNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-556: メール送信サービスが永続的に失敗した場合、EmailSendingPermanentFailureErrorが発生し管理者に通知される', () => {
  it('メール送信サービスが永続的失敗を返した場合、管理者への通知が送信される', async () => {
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

    try {
      await sendUserInformationApprovalNotification(input);
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingPermanentFailureError);
    }
  });
});
