import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  ApprovalDeadlineExceededError,
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

describe('SCEN-411: ユーザー情報の承認期限が経過している場合、ApprovalDeadlineExceededErrorが発生する', () => {
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
  });

  it('ユーザー情報の承認期限が経過している場合、ApprovalDeadlineExceededErrorが発生する', async () => {
    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-001',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    // 承認期限が経過している状態を返す
    mockJudgeBusinessDayAndDeadline.mockImplementation(() => {
      throw new ApprovalDeadlineExceededError('承認期限が経過しているため、承認できません。');
    });

    // @ts-ignore
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(ApprovalDeadlineExceededError);

    // エラーメッセージを確認
    try {
      // @ts-ignore
      await confirmAndApproveUserInformation(input);
    } catch (error: any) {
      expect(error.message).toBe('承認期限が経過しているため、承認できません。');
    }
  });
});
