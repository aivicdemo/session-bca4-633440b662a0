import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  ConfirmAndApproveUserInformationInput,
  ConfirmAndApproveUserInformationOutput,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';

describe('SCEN-408: チームリーダーが未処理のユーザー情報を却下すると、却下理由とともに却下結果がシステムに記録され、通知が送信される', () => {
  const leaderUserId = 'leader-001';
  const reporterUserId = 'reporter-001';
  const userInformationId = 'userinfo-001';
  const rejectionReason = '却下理由テキスト';
  const approvalTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('却下されたユーザー情報を却下理由とともにシステムに記録し、成功結果と状態遷移、通知を返す', async () => {
    // authenticateAndAuthorizeLeaderAccess をスタブ化
    const leaderAuthStub = jest
      .mocked(authenticateAndAuthorizeLeaderAccess)
      .mockResolvedValue({
        authorized: true,
        leaderUserId,
        userInformationId,
      } as any);

    // judgeBusinessDayAndDeadline をスタブ化
    const deadlineStub = jest
      .mocked(judgeBusinessDayAndDeadline)
      .mockResolvedValue({
        isWithinDeadline: true,
        userInformationId,
      } as any);

    // sendUserInformationApprovalNotification をスタブ化
    const notificationStub = jest
      .mocked(sendUserInformationApprovalNotification)
      .mockResolvedValue({
        notificationSent: true,
      } as any);

    // confirmAndApproveUserInformation を呼び出す
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId,
      userInformationId,
      approvalDecision: 'reject',
      rejectionReason,
      approvalTimestamp,
    } as any;

    const result: ConfirmAndApproveUserInformationOutput = await confirmAndApproveUserInformation(input);

    // 関数の戻り値を検証
    // success が true を返す
    expect(result.success).toBe(true);

    // approvalDecision が 'reject' を返す
    expect(result.approvalDecision).toBe('reject');

    // reporterUserId が報告者のユーザーIDを返す
    expect(result.reporterUserId).toBe(reporterUserId);

    // approvalNotificationSent が true を返す
    expect(result.approvalNotificationSent).toBe(true);

    // reporterMasterRegistered が false を返す（却下のため登録なし）
    expect(result.reporterMasterRegistered).toBe(false);

    // processedTimestamp が関数呼び出し時刻以降の日時を返す
    expect(result.processedTimestamp).toBeDefined();
    expect(new Date(result.processedTimestamp).getTime()).toBeGreaterThanOrEqual(approvalTimestamp.getTime());

    // 依存関数が正しく呼ばれたことを確認
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

    // 通知が送信されたことを確認
    expect(notificationStub).toHaveBeenCalled();
  });
});
