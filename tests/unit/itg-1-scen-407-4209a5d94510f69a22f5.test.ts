import {
  confirmAndApproveUserInformation,
  type ConfirmAndApproveUserInformationInput,
  type ConfirmAndApproveUserInformationOutput,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as inputValidationModule from '../../src/logic/input-validation-formatting';
import * as userMasterModule from '../../src/logic/user-master-persistence';
import * as notificationModule from '../../src/logic/email-notification-management';

describe('SCEN-407: チームリーダーが未処理のユーザー情報を承認すると、承認結果と状態遷移がシステムに記録され、通知が送信される', () => {
  const leaderUserId = 'leader-001';
  const reporterUserId = 'reporter-001';
  const userInformationId = 'userinfo-001';
  const reporterEmail = 'reporter@example.com';
  const approvalTimestamp = new Date();

  beforeEach(() => {
    jest.clearAllMocks();

    // ステップ1: authenticateAndAuthorizeLeaderAccess をスタブ化
    jest.spyOn(userAuthModule, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      authorized: true,
      hasApprovalAuthority: true,
      leaderTeamId: 'team-001',
      targetTeamId: 'team-001',
    } as any);

    // ステップ2: judgeBusinessDayAndDeadline をスタブ化
    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockResolvedValue({
      isWithinDeadline: true,
      daysRemaining: 2,
    } as any);

    // ステップ3: detectDuplicateEmailAddress をスタブ化
    jest.spyOn(inputValidationModule, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: false,
      duplicateReporterUserId: null,
    } as any);

    // ステップ4: registerReporterToMaster をスタブ化
    jest.spyOn(userMasterModule, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterUserId: reporterUserId,
    } as any);

    // ステップ5: sendUserInformationApprovalNotification をスタブ化
    jest.spyOn(notificationModule, 'sendUserInformationApprovalNotification').mockResolvedValue({
      success: true,
      notificationSent: true,
    } as any);
  });

  test('approval decision and state transition are recorded with notification sent', async () => {
    // ステップ6: confirmAndApproveUserInformation を呼び出す
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: leaderUserId,
      userInformationId: userInformationId,
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: approvalTimestamp,
    };

    const result: ConfirmAndApproveUserInformationOutput = await confirmAndApproveUserInformation(input);

    // ステップ7-12: 戻り値の各フィールドを検証
    expect(result.success).toBe(true);
    expect(result.approvalDecision).toBe('approve');
    expect(result.reporterUserId).toBe(reporterUserId);
    expect(result.approvalNotificationSent).toBe(true);
    expect(result.reporterMasterRegistered).toBe(true);
    expect(result.processedTimestamp).toBeInstanceOf(Date);
    expect(result.processedTimestamp.getTime()).toBeGreaterThanOrEqual(approvalTimestamp.getTime());
  });
});
