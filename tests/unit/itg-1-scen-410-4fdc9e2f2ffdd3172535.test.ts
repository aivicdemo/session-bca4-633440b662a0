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
  LeaderAuthorizationError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { registerReporterToMaster } from '../../src/logic/user-master-persistence';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedSendUserInformationApprovalNotification = sendUserInformationApprovalNotification as jest.Mock;

describe('SCEN-410: LeaderAuthorizationError when leader lacks approval authority', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderAuthorizationError with correct message when leader lacks approval authority', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。')
    );

    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown LeaderAuthorizationError');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderAuthorizationError);
      expect((error as Error).message).toBe('このユーザー情報を承認する権限がありません。');
    }
  });

  it('should not call downstream functions when LeaderAuthorizationError is thrown', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。')
    );

    const input = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
    } catch (e) {
      // Expected
    }

    expect(mockedJudgeBusinessDayAndDeadline).not.toHaveBeenCalled();
    expect(mockedDetectDuplicateEmailAddress).not.toHaveBeenCalled();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedSendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
