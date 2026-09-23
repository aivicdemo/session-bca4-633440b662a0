import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-407: チームリーダーが未処理のユーザー情報を承認すると、承認結果と状態遷移がシステムに記録され、通知が送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームリーダーが未処理のユーザー情報を承認したとき、success=true を返す', async () => {
    const now = new Date();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const result = await confirmAndApproveUserInformation(input);

    expect(result.success).toBe(true);
  });

  it('承認決定時、approvalDecision=approve を返す', async () => {
    const now = new Date();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const result = await confirmAndApproveUserInformation(input);

    expect(result.approvalDecision).toBe('approve');
  });

  it("承認決定時、reporterUserId='reporter-001' を返す", async () => {
    const now = new Date();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const result = await confirmAndApproveUserInformation(input);

    expect(result.reporterUserId).toBe('reporter-001');
  });

  it('承認決定時、approvalNotificationSent=true を返す', async () => {
    const now = new Date();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const result = await confirmAndApproveUserInformation(input);

    expect(result.approvalNotificationSent).toBe(true);
  });

  it('承認決定時、reporterMasterRegistered=true を返す', async () => {
    const now = new Date();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const result = await confirmAndApproveUserInformation(input);

    expect(result.reporterMasterRegistered).toBe(true);
  });

  it('承認決定時、processedTimestamp が呼び出し時刻以降の日時を返す', async () => {
    const now = new Date();
    const beforeCall = now.getTime();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const result = await confirmAndApproveUserInformation(input);

    const processedTime = new Date(result.processedTimestamp).getTime();
    expect(processedTime).toBeGreaterThanOrEqual(beforeCall);
  });

  it('承認処理が完了したとき、registerReporterToMaster が呼ばれて報告者がマスタに登録される', async () => {
    const now = new Date();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const userPersistence = require('../../src/logic/user-master-persistence');

    await confirmAndApproveUserInformation(input);

    expect(userPersistence.registerReporterToMaster).toHaveBeenCalled();
  });

  it('承認処理が完了したとき、sendUserInformationApprovalNotification が呼ばれて通知が送信される', async () => {
    const now = new Date();
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-001',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: now,
    };

    const emailNotification = require('../../src/logic/email-notification-management');

    await confirmAndApproveUserInformation(input);

    expect(emailNotification.sendUserInformationApprovalNotification).toHaveBeenCalled();
  });
});
