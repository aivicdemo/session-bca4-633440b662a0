jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/user-information-input-confirmation', () => ({
  buildUserInformationConfirmationStatusList: jest.fn(),
}));

import {
  retrieveUserInformationConfirmationStatus,
  buildUserInformationConfirmationStatusList,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedBuildUserInformationConfirmationStatusList = buildUserInformationConfirmationStatusList as jest.Mock;

describe('SCEN-415: Successfully retrieve user information confirmation status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user information confirmation status with correct counts when leader has authority', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    });

    const mockRecords = {
      pendingApprovals: [
        { userInformationId: 'uid-1', reporterName: 'ユーザーA', emailAddress: 'a@example.com', status: 'pending' },
        { userInformationId: 'uid-2', reporterName: 'ユーザーB', emailAddress: 'b@example.com', status: 'pending' },
      ],
      approvedRecords: [
        { userInformationId: 'uid-3', reporterName: 'ユーザーC', emailAddress: 'c@example.com', status: 'approved' },
        { userInformationId: 'uid-4', reporterName: 'ユーザーD', emailAddress: 'd@example.com', status: 'approved' },
        { userInformationId: 'uid-5', reporterName: 'ユーザーE', emailAddress: 'e@example.com', status: 'approved' },
      ],
      expiredApprovals: [
        { userInformationId: 'uid-6', reporterName: 'ユーザーF', emailAddress: 'f@example.com', status: 'expired' },
      ],
    };

    mockedBuildUserInformationConfirmationStatusList.mockResolvedValue(mockRecords);

    const input = {
      leaderUserId: 'leader-001',
      retrievalTimestamp: new Date(),
    };

    const result = await retrieveUserInformationConfirmationStatus(input);

    expect(result.success).toBe(true);
    expect(result.pendingApprovals).toHaveLength(2);
    expect(result.approvedRecords).toHaveLength(3);
    expect(result.expiredApprovals).toHaveLength(1);
    expect(result.totalCount).toBe(6);
  });
});
