import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  InvalidApprovalDecisionError,
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

describe('SCEN-413: 承認判定フィールドが\'approve\'または\'reject\'以外の値である場合、InvalidApprovalDecisionErrorが発生する', () => {
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

    // メールアドレス重複なし
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
  });

  it('承認判定フィールドが\'approve\'または\'reject\'以外の値である場合、InvalidApprovalDecisionErrorが発生する', async () => {
    const input = {
      leaderUserId: 'leader001',
      userInformationId: 'info001',
      approvalDecision: 'invalid_value',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      // @ts-ignore
      await confirmAndApproveUserInformation(input);
      throw new Error('InvalidApprovalDecisionError should be thrown');
    } catch (error: any) {
      if (error instanceof InvalidApprovalDecisionError) {
        expect(error.message).toBe('承認判定は\'approve\'または\'reject\'である必要があります。');
      } else if (error.message === 'InvalidApprovalDecisionError should be thrown') {
        throw error;
      } else {
        expect(error).toBeInstanceOf(InvalidApprovalDecisionError);
      }
    }
  });
});
