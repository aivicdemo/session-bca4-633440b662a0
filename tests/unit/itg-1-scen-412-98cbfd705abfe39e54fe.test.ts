jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/input-validation-formatting', () => ({
  detectDuplicateEmailAddress: jest.fn(),
}));

import {
  confirmAndApproveUserInformation,
  DuplicateEmailAddressDetectedError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;

describe('SCEN-412: DuplicateEmailAddressDetectedError when email is already registered', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DuplicateEmailAddressDetectedError with correct message when email is already registered', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    });
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      withinDeadline: true,
    });
    mockedDetectDuplicateEmailAddress.mockRejectedValue(
      new DuplicateEmailAddressDetectedError('このメールアドレスは既に登録されています。')
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
      fail('Should have thrown DuplicateEmailAddressDetectedError');
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateEmailAddressDetectedError);
      expect((error as Error).message).toBe('このメールアドレスは既に登録されています。');
    }
  });
});
