jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  detectDuplicateEmailAddress: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/email-notification-management');

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
      isAccessGranted: true,
      userId: 'leader001',
    });
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isWithinDeadline: true,
    });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      duplicateReporterUserId: null,
      duplicateReporterName: null,
    });

    const input = {
      leaderUserId: 'leader001',
      userInformationId: 'info001',
      approvalDecision: 'invalid_value',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    } as any;

    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(InvalidApprovalDecisionError);
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      '承認判定は\'approve\'または\'reject\'である必要があります。'
    );
  });
});
