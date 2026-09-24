jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));

import {
  confirmAndApproveUserInformation,
  UserInformationNotFoundError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;

describe('SCEN-409: UserInformationNotFoundError when user information does not exist or is already processed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserInformationNotFoundError with correct message when userInformationId does not exist', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    });
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      withinDeadline: true,
    });

    const input = {
      leaderUserId: 'leader001',
      userInformationId: 'nonexistent-id-12345',
      approvalDecision: 'approve' as const,
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown UserInformationNotFoundError');
    } catch (error) {
      expect(error).toBeInstanceOf(UserInformationNotFoundError);
      expect((error as Error).message).toBe('ユーザー情報が見つからないか、既に処理済みです。');
    }
  });
});
