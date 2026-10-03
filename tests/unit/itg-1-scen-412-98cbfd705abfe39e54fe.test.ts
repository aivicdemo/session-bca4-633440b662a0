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
  ConfirmAndApproveUserInformationInput,
  DuplicateEmailAddressDetectedError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;

describe('SCEN-412: DuplicateEmailAddressDetectedError when email is already registered', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DuplicateEmailAddressDetectedError with correct message when email is already registered', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader-001',
    });
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isWithinDeadline: true,
    });
    mockedDetectDuplicateEmailAddress.mockRejectedValue(
      new DuplicateEmailAddressDetectedError('このメールアドレスは既に登録されています。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(DuplicateEmailAddressDetectedError);
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      'このメールアドレスは既に登録されています。'
    );
  });
});
