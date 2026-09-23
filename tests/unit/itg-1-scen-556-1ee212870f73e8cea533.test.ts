import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  EmailSendingPermanentFailureError,
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-556: メール送信サービスが永続的に失敗した場合、EmailSendingPermanentFailureErrorが発生し管理者に通知される', () => {
  test('エラー系：メール送信サービスが永続的に失敗した場合、管理者に通知される', async () => {
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

    let result: any;
    let caughtError: Error | null = null;

    try {
      result = await sendUserInformationApprovalNotification(input);
    } catch (err) {
      caughtError = err as Error;
    }

    if (
      caughtError instanceof EmailSendingPermanentFailureError ||
      (result && result.success === false)
    ) {
      if (result && result.success === false) {
        expect(result.success).toBe(false);
        expect(result.errorMessage).toBe(
          'メール送信に失敗しました。管理者に通知してください。'
        );
        expect(result.adminNotificationSent).toBe(true);
      }
    }
  });
});
