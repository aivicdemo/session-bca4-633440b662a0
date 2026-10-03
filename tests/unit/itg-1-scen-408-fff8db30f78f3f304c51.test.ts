import {
  confirmAndApproveUserInformation,
  type ConfirmAndApproveUserInformationInput,
  type ConfirmAndApproveUserInformationOutput,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as notificationModule from '../../src/logic/email-notification-management';

describe('SCEN-408: チームリーダーが未処理のユーザー情報を却下すると、却下理由とともに却下結果がシステムに記録され、通知が送信される', () => {
  const leaderUserId = 'leader-001';
  const reporterUserId = 'reporter-001';
  const userInformationId = 'userinfo-001';
  const rejectionReason = '却下理由テキスト';
  const approvalTimestamp = new Date();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(userAuthModule, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      authorized: true,
      hasApprovalAuthority: true,
      leaderTeamId: 'team-001',
      targetTeamId: 'team-001',
    } as any);

    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isWithinDeadline: true,
      daysRemaining: 2,
    } as any);

    jest.spyOn(notificationModule, 'sendUserInformationApprovalNotification').mockResolvedValue({
      success: true,
      notificationSent: true,
    } as any);
  });

  test('rejection decision with reason is recorded and notification is sent', async () => {
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: leaderUserId,
      userInformationId: userInformationId,
      approvalDecision: 'reject',
      rejectionReason: rejectionReason,
      approvalTimestamp: approvalTimestamp,
    };

    const result: ConfirmAndApproveUserInformationOutput = await confirmAndApproveUserInformation(input);

    expect(result.success).toBe(true);
    expect(result.approvalDecision).toBe('reject');
    expect(result.reporterUserId).toBe(reporterUserId);
    expect(result.approvalNotificationSent).toBe(true);
    expect(result.reporterMasterRegistered).toBe(false);
    expect(result.processedTimestamp).toBeInstanceOf(Date);
    expect(result.processedTimestamp.getTime()).toBeGreaterThanOrEqual(approvalTimestamp.getTime());
  });
});
