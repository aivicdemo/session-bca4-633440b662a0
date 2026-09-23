import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  DuplicateEmailAddressDetectedError,
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

describe('SCEN-412: 承認対象のメールアドレスが既に別のユーザーと重複している場合、DuplicateEmailAddressDetectedErrorが発生する', () => {
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

    // リーダー権限チェックは成功
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ authorized: true });

    // 期限内を返す
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({ withinDeadline: true });
  });

  it('承認対象のメールアドレスが既に別のユーザーと重複している場合、DuplicateEmailAddressDetectedErrorが発生する', async () => {
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    // メールアドレス重複を検出
    mockDetectDuplicateEmailAddress.mockImplementation(() => {
      throw new DuplicateEmailAddressDetectedError('このメールアドレスは既に登録されています。');
    });

    // @ts-ignore
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(DuplicateEmailAddressDetectedError);

    // エラーメッセージを確認
    try {
      // @ts-ignore
      await confirmAndApproveUserInformation(input);
    } catch (error: any) {
      expect(error.message).toBe('このメールアドレスは既に登録されています。');
    }

    // 呼び出し先が実行されていないことを確認
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockSendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
