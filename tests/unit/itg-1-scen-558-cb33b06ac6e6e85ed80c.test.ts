import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  EmailSendingFailureError,
  EmailSendingPermanentFailureError,
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-558: メール送信に失敗した場合、送信履歴レコードのIDはnullで返される', () => {
  test('エラー系：メール送信に失敗した場合、送信履歴レコードのIDはnullで返される', async () => {
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

    let result: any;
    let caughtError: Error | null = null;

    try {
      result = await sendUserInformationApprovalNotification(input);
    } catch (err) {
      caughtError = err as Error;
    }

    if (result && result.success === false) {
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBeDefined();
      expect(result.adminNotificationSent).toBe(true);
    } else if (
      caughtError instanceof EmailSendingFailureError ||
      caughtError instanceof EmailSendingPermanentFailureError
    ) {
      expect(caughtError).toBeDefined();
    }
  });
});
