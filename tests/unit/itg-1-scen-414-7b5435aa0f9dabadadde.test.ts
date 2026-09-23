import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  ApprovalNotificationSendFailureError,
} from '../../src/logic/user-information-input-confirmation';

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

describe('SCEN-414: 承認結果の通知送信に失敗した場合、ApprovalNotificationSendFailureErrorが発生する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockSendUserInformationApprovalNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts').authenticateAndAuthorizeLeaderAccess;
    mockJudgeBusinessDayAndDeadline = require('../../src/logic/business-day-deadline-judgment.ts').judgeBusinessDayAndDeadline;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts').detectDuplicateEmailAddress;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts').registerReporterToMaster;
    mockSendUserInformationApprovalNotification = require('../../src/logic/email-notification-management.ts').sendUserInformationApprovalNotification;

    // スタブ設定: 各処理が成功を返す
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ authorized: true });
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({ withinDeadline: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ success: true });
  });

  it('承認結果の通知送信に失敗した場合、ApprovalNotificationSendFailureErrorが発生する', async () => {
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    // 通知送信の失敗を設定
    mockSendUserInformationApprovalNotification.mockImplementation(() => {
      throw new ApprovalNotificationSendFailureError('承認結果の通知送信に失敗しました。');
    });

    // @ts-ignore
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(ApprovalNotificationSendFailureError);

    // エラーメッセージを確認
    try {
      // @ts-ignore
      await confirmAndApproveUserInformation(input);
    } catch (error: any) {
      expect(error.message).toBe('承認結果の通知送信に失敗しました。');
    }

    // 依存先処理が呼び出されたことを確認
    expect(mockAuthenticateAndAuthorizeLeaderAccess).toHaveBeenCalled();
    expect(mockJudgeBusinessDayAndDeadline).toHaveBeenCalled();
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalled();
    expect(mockRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockSendUserInformationApprovalNotification).toHaveBeenCalled();
  });
});
