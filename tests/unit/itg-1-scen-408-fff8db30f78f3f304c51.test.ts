import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  ConfirmAndApproveUserInformationInput,
  ConfirmAndApproveUserInformationOutput,
} from '../../src/logic/user-information-input-confirmation';

// 依存先のモック
jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  registerReporterToMaster: jest.fn(),
}));

jest.mock('../../src/logic/email-notification-management.ts', () => ({
  sendUserInformationApprovalNotification: jest.fn(),
}));

describe('SCEN-408: チームリーダーが未処理のユーザー情報を却下すると、却下理由とともに却下結果がシステムに記録され、通知が送信される', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockSendUserInformationApprovalNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 各モックを取得
    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts')
      .authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline = require('../../src/logic/business-day-deadline-judgment.ts')
      .judgeBusinessDayAndDeadline as jest.Mock;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .detectDuplicateEmailAddress as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts')
      .registerReporterToMaster as jest.Mock;
    mockSendUserInformationApprovalNotification = require('../../src/logic/email-notification-management.ts')
      .sendUserInformationApprovalNotification as jest.Mock;

    // 成功応答に設定
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthorized: true,
      leaderUserId: 'L001',
    });

    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({
      isWithinDeadline: true,
    });

    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
    });

    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({
      success: true,
    });

    // @ts-ignore
    mockSendUserInformationApprovalNotification.mockResolvedValue({
      notificationSent: true,
    });
  });

  it('チームリーダーが未処理のユーザー情報を却下すると、却下理由とともに却下結果がシステムに記録され、通知が送信される', async () => {
    // テスト対象processのスタブ設定完了

    // 入力値を構築
    const rejectionReason = '却下理由テキスト';
    const leaderUserId = 'L001';
    const userInformationId = 'U_INFO_001';
    const approvalTimestamp = new Date();

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: leaderUserId,
      userInformationId: userInformationId,
      approvalDecision: 'reject',
      rejectionReason: rejectionReason,
      approvalTimestamp: approvalTimestamp,
    };

    // 実行
    // @ts-ignore
    const result: ConfirmAndApproveUserInformationOutput = await confirmAndApproveUserInformation(input);

    // 期待結果を検証: success が true を返す
    expect(result.success).toBe(true);

    // approvalDecision が 'reject' を返す
    expect(result.approvalDecision).toBe('reject');

    // reporterUserId が報告者のユーザーIDを返す
    expect(result.reporterUserId).toBeDefined();
    expect(typeof result.reporterUserId).toBe('string');

    // approvalNotificationSent が true を返す
    expect(result.approvalNotificationSent).toBe(true);

    // reporterMasterRegistered が false を返す（却下のため登録なし）
    expect(result.reporterMasterRegistered).toBe(false);

    // processedTimestamp が関数呼び出し時刻以降の日時を返す
    expect(result.processedTimestamp).toBeDefined();
    expect(result.processedTimestamp.getTime()).toBeGreaterThanOrEqual(approvalTimestamp.getTime());

    // システムに却下判定・却下理由・処理結果が記録されていることを確認
    // mockSendUserInformationApprovalNotification が呼び出されていることを検証
    expect(mockSendUserInformationApprovalNotification).toHaveBeenCalled();

    // 通知の呼び出し時に却下理由が含まれていることを検証
    const notificationCall = mockSendUserInformationApprovalNotification.mock.calls[0][0] as any;
    expect(notificationCall).toBeDefined();
    expect(notificationCall.rejectionReason).toBe(rejectionReason);

    // registerReporterToMaster が呼び出されていないことを検証（却下のため）
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
  });
});
