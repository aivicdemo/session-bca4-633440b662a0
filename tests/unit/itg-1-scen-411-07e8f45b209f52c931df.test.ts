jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));

import {
  confirmAndApproveUserInformation,
  ConfirmAndApproveUserInformationInput,
  ApprovalDeadlineExceededError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;

describe('SCEN-411: ApprovalDeadlineExceededError when approval deadline has passed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ApprovalDeadlineExceededError with correct message when approval deadline has passed', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    });
    mockedJudgeBusinessDayAndDeadline.mockRejectedValue(
      new ApprovalDeadlineExceededError('承認期限が経過しているため、承認できません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-001',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown ApprovalDeadlineExceededError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApprovalDeadlineExceededError);
      expect((error as Error).message).toBe('承認期限が経過しているため、承認できません。');
    }
  });
});
