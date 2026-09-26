import { describe, it, expect } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  LeaderNotFoundError,
} from '../../src/logic/email-notification-management';
import type { SendUserInformationApprovalNotificationInput } from '../../src/logic/email-notification-management';

describe('SCEN-554: 指定されたリーダーユーザーIDが存在しない場合、LeaderNotFoundErrorが発生する', () => {
  it('リーダーユーザーIDが存在しない場合、LeaderNotFoundErrorが発生する', async () => {
    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'non-existent-leader-id',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter-001',
      reporterName: '山田太郎',
      approvalStatus: 'approved',
      rejectionReason: null,
      approvalTimestamp: '2025-01-15T10:30:00Z',
      confirmingLeaderUserId: 'leader-002',
    };

    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      LeaderNotFoundError
    );

    try {
      await sendUserInformationApprovalNotification(input);
      fail('Expected LeaderNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderNotFoundError);
      if (error instanceof LeaderNotFoundError) {
        expect(error.message).toBe('リーダーユーザーが見つかりません。');
      }
    }
  });
});
