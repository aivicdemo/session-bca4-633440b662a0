import { sendUserInformationApprovalNotification, EmailSendingFailureError } from '../../src/logic/email-notification-management';
import type { SendUserInformationApprovalNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-555: メール送信サービスが一時的に利用不可の場合、EmailSendingFailureErrorが発生する', () => {
  it('メール送信サービスが一時的利用不可（503エラー）を返した場合、EmailSendingFailureErrorが発生する', async () => {
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

    try {
      await sendUserInformationApprovalNotification(input);
    } catch (error) {
      expect(error).toBeInstanceOf(EmailSendingFailureError);
    }
  });
});
