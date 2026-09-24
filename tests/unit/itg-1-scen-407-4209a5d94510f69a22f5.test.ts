import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  ConfirmAndApproveUserInformationInput,
  ConfirmAndApproveUserInformationOutput,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { registerReporterToMaster } from '../../src/logic/user-master-persistence';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';

describe('SCEN-407: チームリーダーが未処理のユーザー情報を承認すると、承認結果と状態遷移がシステムに記録され、通知が送信される', () => {
  const leaderUserId = 'leader-001';
  const reporterUserId = 'reporter-001';
  const userInformationId = 'userinfo-001';
  const reporterEmail = 'reporter@example.com';
  const approvalTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('承認されたユーザー情報をシステムに記録し、成功結果と状態遷移、通知を返す', async () => {
    // ステップ1: authenticateAndAuthorizeLeaderAccess をスタブ化
    const leaderAuthStub = jest
      .mocked(authenticateAndAuthorizeLeaderAccess)
      .mockResolvedValue({
        authorized: true,
        leaderUserId,
        userInformationId,
      } as any);

    // ステップ2: judgeBusinessDayAndDeadline をスタブ化
    const deadlineStub = jest
      .mocked(judgeBusinessDayAndDeadline)
      .mockResolvedValue({
        isWithinDeadline: true,
        userInformationId,
      } as any);

    // ステップ3: detectDuplicateEmailAddress をスタブ化
    const duplicateStub = jest
      .mocked(detectDuplicateEmailAddress)
      .mockResolvedValue({
        isDuplicate: false,
        emailAddress: reporterEmail,
      } as any);

    // ステップ4: registerReporterToMaster をスタブ化
    const registerStub = jest
      .mocked(registerReporterToMaster)
      .mockResolvedValue({
        success: true,
        reporterUserId,
      } as any);

    // ステップ5: sendUserInformationApprovalNotification をスタブ化
    const notificationStub = jest
      .mocked(sendUserInformationApprovalNotification)
      .mockResolvedValue({
        notificationSent: true,
      } as any);

    // ステップ6: confirmAndApproveUserInformation を呼び出す
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId,
      userInformationId,
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp,
    } as any;

    const result: ConfirmAndApproveUserInformationOutput = await confirmAndApproveUserInformation(input);

    // ステップ7: success フィールドを検証
    expect(result.success).toBe(true);

    // ステップ8: approvalDecision フィールドを検証
    expect(result.approvalDecision).toBe('approve');

    // ステップ9: reporterUserId フィールドを検証
    expect(result.reporterUserId).toBe(reporterUserId);

    // ステップ10: approvalNotificationSent フィールドを検証
    expect(result.approvalNotificationSent).toBe(true);

    // ステップ11: reporterMasterRegistered フィールドを検証
    expect(result.reporterMasterRegistered).toBe(true);

    // ステップ12: processedTimestamp フィールドを検証
    // processedTimestamp は呼び出し時刻以降の日時であること
    expect(result.processedTimestamp).toBeDefined();
    expect(new Date(result.processedTimestamp).getTime()).toBeGreaterThanOrEqual(approvalTimestamp.getTime());

    // 依存関数が正しい入力で呼ばれたことを確認
    expect(leaderAuthStub).toHaveBeenCalledWith(
      expect.objectContaining({
        leaderUserId,
        userInformationId,
      })
    );

    expect(deadlineStub).toHaveBeenCalledWith(
      expect.objectContaining({
        userInformationId,
      })
    );

    expect(duplicateStub).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: reporterEmail,
      })
    );

    expect(registerStub).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterUserId,
      })
    );

    expect(notificationStub).toHaveBeenCalled();
  });
});
