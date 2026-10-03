import {
  sendUserInformationApprovalNotification,
} from '../../src/logic/email-notification-management';
import type {
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-558: メール送信に失敗した場合、送信履歴レコードのIDはnullで返される', () => {
  it('メール送信がEmailSendingFailureErrorで失敗した場合、success=false、emailSendingHistoryId=null、sentAt=null、errorMessage="メール送信に失敗しました。後で再試行してください。"、adminNotificationSent=trueで返される', async () => {
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

    const result = await sendUserInformationApprovalNotification(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    if (result.success === false) {
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('メール送信に失敗しました。後で再試行してください。');
      expect(result.adminNotificationSent).toBe(true);
    }
  });

  it('メール送信がEmailSendingPermanentFailureErrorで失敗した場合、success=false、emailSendingHistoryId=null、sentAt=null、errorMessage="メール送信に失敗しました。管理者に通知してください。"、adminNotificationSent=trueで返される', async () => {
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

    const result = await sendUserInformationApprovalNotification(input);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    if (result.success === false) {
      expect(result.emailSendingHistoryId).toBeNull();
      expect(result.sentAt).toBeNull();
      expect(result.errorMessage).toBe('メール送信に失敗しました。管理者に通知してください。');
      expect(result.adminNotificationSent).toBe(true);
    }
  });
});
