import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  EmailSendingFailureError,
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-555: メール送信サービスが一時的に利用不可の場合、EmailSendingFailureErrorが発生する', () => {
  test('エラー系：メール送信サービスが一時的に利用不可の場合、EmailSendingFailureErrorが発生する', async () => {
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

    const error = await sendUserInformationApprovalNotification(input).catch(
      (err) => err
    );

    expect(error).toBeInstanceOf(EmailSendingFailureError);
    if (error instanceof EmailSendingFailureError) {
      expect(error.message).toBe(
        'メール送信に失敗しました。後で再試行してください。'
      );
    }
  });
});
