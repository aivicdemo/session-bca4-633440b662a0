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
  InvalidApprovalDecisionError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;

describe('SCEN-413: InvalidApprovalDecisionError when approvalDecision is invalid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidApprovalDecisionError with correct message when approvalDecision is invalid', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    });
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      withinDeadline: true,
    });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
    });

    const input = {
      leaderUserId: 'leader001',
      userInformationId: 'info001',
      approvalDecision: 'invalid_value' as any,
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown InvalidApprovalDecisionError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidApprovalDecisionError);
      expect((error as Error).message).toBe('承認判定は\'approve\'または\'reject\'である必要があります。');
    }
  });

  it('should throw InvalidApprovalDecisionError for empty string', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    });
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      withinDeadline: true,
    });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
    });

    const input = {
      leaderUserId: 'leader001',
      userInformationId: 'info001',
      approvalDecision: '' as any,
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown InvalidApprovalDecisionError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidApprovalDecisionError);
      expect((error as Error).message).toBe('承認判定は\'approve\'または\'reject\'である必要があります。');
    }
  });
});
