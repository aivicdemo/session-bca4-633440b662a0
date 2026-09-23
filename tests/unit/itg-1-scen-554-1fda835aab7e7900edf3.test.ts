import { jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  LeaderNotFoundError,
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

describe('SCEN-554: 指定されたリーダーユーザーIDが存在しない場合、LeaderNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('エラー系：リーダーユーザーIDが存在しない場合、LeaderNotFoundErrorが発生する', async () => {
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

    const error = await sendUserInformationApprovalNotification(input).catch(
      (err) => err
    );

    expect(error).toBeInstanceOf(LeaderNotFoundError);
    expect(error.message).toBe('リーダーユーザーが見つかりません。');
  });
});
