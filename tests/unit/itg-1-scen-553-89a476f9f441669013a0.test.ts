import { sendUserInformationApprovalNotification, InvalidLeaderEmailAddressError, LeaderEmailAddressInvalidError } from '../../src/logic/email-notification-management';
import type { SendUserInformationApprovalNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-553: リーダーのメールアドレス形式が無効な場合、InvalidLeaderEmailAddressErrorが発生する', () => {
  it('リーダーのメールアドレス形式が無効な場合、InvalidLeaderEmailAddressErrorが発生する', async () => {
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

    try {
      await sendUserInformationApprovalNotification(input);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error instanceof InvalidLeaderEmailAddressError || error instanceof LeaderEmailAddressInvalidError).toBe(true);
    }
  });
});
