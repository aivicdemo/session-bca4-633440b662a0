import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  LeaderAuthorizationError,
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

describe('SCEN-410: チームリーダーが当該ユーザー情報の承認権限を持たない場合、LeaderAuthorizationErrorが発生する', () => {
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
  });

  it('チームリーダーが当該ユーザー情報の承認権限を持たない場合、LeaderAuthorizationErrorが発生する', async () => {
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    // リーダー権限がない場合のエラーを発生させる
    mockAuthenticateAndAuthorizeLeaderAccess.mockImplementation(() => {
      throw new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。');
    });

    // @ts-ignore
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(LeaderAuthorizationError);

    // エラーメッセージを確認
    try {
      // @ts-ignore
      await confirmAndApproveUserInformation(input);
    } catch (error: any) {
      expect(error.message).toBe('このユーザー情報を承認する権限がありません。');
    }

    // 呼び出し先が実行されていないことを確認
    expect(mockJudgeBusinessDayAndDeadline).not.toHaveBeenCalled();
    expect(mockDetectDuplicateEmailAddress).not.toHaveBeenCalled();
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockSendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
