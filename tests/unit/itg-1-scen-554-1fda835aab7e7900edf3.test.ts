import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  LeaderNotFoundError,
} from '../../src/logic/email-notification-management';
import type {
  SendUserInformationApprovalNotificationInput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-554: 指定されたリーダーユーザーIDが存在しない場合、LeaderNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダーユーザーIDが存在しない場合、LeaderNotFoundErrorが発生する', async () => {
    jest.mocked(sendUserInformationApprovalNotification).mockImplementation(async () => {
      throw new LeaderNotFoundError('リーダーユーザーが見つかりません。');
    });

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
    await expect(sendUserInformationApprovalNotification(input)).rejects.toThrow(
      'リーダーユーザーが見つかりません。'
    );
  });
});
