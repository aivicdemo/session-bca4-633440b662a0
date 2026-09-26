import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/input-validation-formatting', () => ({
  detectDuplicateEmailAddress: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn(),
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
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { registerReporterToMaster } from '../../src/logic/user-master-persistence';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedSendUserInformationApprovalNotification = sendUserInformationApprovalNotification as jest.MockedFunction<any>;

describe('SCEN-407: チームリーダーが未処理のユーザー情報を承認すると、承認結果と状態遷移がシステムに記録され、通知が送信される', () => {
  const leaderUserId = 'leader-001';
  const reporterUserId = 'reporter-001';
  const userInformationId = 'userinfo-001';
  const reporterEmail = 'reporter@example.com';
  const approvalTimestamp = new Date();

  beforeEach(() => {
    jest.clearAllMocks();

    // ステップ1: authenticateAndAuthorizeLeaderAccess をスタブ化
    // leaderUserId='leader-001'に対して権限あり（当該ユーザー情報の承認権限を持つ同一チーム所属）
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
      hasApprovalAuthority: true,
      leaderTeamId: 'team-001',
      targetTeamId: 'team-001',
    });

    // ステップ2: judgeBusinessDayAndDeadline をスタブ化
    // userInformationId='userinfo-001'に対して承認期限内（期限経過なし）
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isWithinDeadline: true,
      daysRemaining: 2,
    });

    // ステップ3: detectDuplicateEmailAddress をスタブ化
    // メールアドレス='reporter@example.com'に対してシステム内に重複なし
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      duplicateReporterUserId: null,
    });

    // ステップ4: registerReporterToMaster をスタブ化
    // reporterUserId='reporter-001'に対して報告者マスタ登録成功
    mockedRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterUserId: reporterUserId,
    });

    // ステップ5: sendUserInformationApprovalNotification をスタブ化
    // 承認通知メール送信成功
    mockedSendUserInformationApprovalNotification.mockResolvedValue({
      success: true,
      notificationSent: true,
    });
  });

  it('should record approval decision and send notifications when user information is approved', async () => {
    // ステップ6: confirmAndApproveUserInformation を呼び出す
    // 入力: leaderUserId='leader-001'、userInformationId='userinfo-001'、
    // approvalDecision='approve'、rejectionReason=null、approvalTimestamp=現在日時
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: leaderUserId,
      userInformationId: userInformationId,
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: approvalTimestamp,
    };

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
    // processedTimestamp がシステムに記録された日時（呼び出し時刻以降）
    expect(result.processedTimestamp).toBeInstanceOf(Date);
    expect(result.processedTimestamp.getTime()).toBeGreaterThanOrEqual(approvalTimestamp.getTime());
  });
});
