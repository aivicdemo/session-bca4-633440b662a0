import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendUserInformationApprovalNotification: jest.fn(),
}));

import {
  confirmAndApproveUserInformation,
  type ConfirmAndApproveUserInformationInput,
  type ConfirmAndApproveUserInformationOutput,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedSendUserInformationApprovalNotification = sendUserInformationApprovalNotification as jest.MockedFunction<any>;

describe('SCEN-408: チームリーダーが未処理のユーザー情報を却下すると、却下理由とともに却下結果がシステムに記録され、通知が送信される', () => {
  const leaderUserId = 'leader-001';
  const reporterUserId = 'reporter-001';
  const userInformationId = 'userinfo-001';
  const rejectionReason = '却下理由テキスト';
  const approvalTimestamp = new Date();

  beforeEach(() => {
    jest.clearAllMocks();

    // authenticateAndAuthorizeLeaderAccess をスタブ化
    // リーダーが当該ユーザー情報の承認権限を持つことを返す
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
      hasApprovalAuthority: true,
      leaderTeamId: 'team-001',
      targetTeamId: 'team-001',
    });

    // judgeBusinessDayAndDeadline をスタブ化
    // 承認期限内であることを返す
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isWithinDeadline: true,
      daysRemaining: 2,
    });

    // sendUserInformationApprovalNotification をスタブ化
    // リーダーと報告者への通知送信が成功することを返す
    mockedSendUserInformationApprovalNotification.mockResolvedValue({
      success: true,
      notificationSent: true,
    });
  });

  it('should record rejection decision with reason and send notification when user information is rejected', async () => {
    // confirmAndApproveUserInformation を呼び出す
    // 入力: leaderUserId=チームリーダーID、userInformationId=未処理のユーザー情報ID、
    // approvalDecision='reject'、rejectionReason='却下理由テキスト'、approvalTimestamp=承認判定日時
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: leaderUserId,
      userInformationId: userInformationId,
      approvalDecision: 'reject',
      rejectionReason: rejectionReason,
      approvalTimestamp: approvalTimestamp,
    };

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
    expect(result.processedTimestamp).toBeInstanceOf(Date);
    expect(result.processedTimestamp.getTime()).toBeGreaterThanOrEqual(approvalTimestamp.getTime());
  });
});
