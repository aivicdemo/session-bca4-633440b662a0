import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  InvalidLeaderEmailAddressError,
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-553: リーダーのメールアドレス形式が無効な場合、InvalidLeaderEmailAddressErrorが発生する', () => {
  test('エラー系：無効なメールアドレス形式の場合、InvalidLeaderEmailAddressErrorが発生する', async () => {
    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email-format',
      reporterUserId: 'reporter-001',
      reporterName: '山田太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2024-01-15T10:30:00Z',
      confirmingLeaderUserId: 'leader-002',
    };

    const error = await sendUserInformationApprovalNotification(input).catch(
      (err) => err
    );

    expect(error).toBeInstanceOf(InvalidLeaderEmailAddressError);
    if (error instanceof InvalidLeaderEmailAddressError) {
      expect(error.message).toBe(
        'リーダーのメールアドレスが無効です。管理者に通知してください。'
      );
    }
  });
});
