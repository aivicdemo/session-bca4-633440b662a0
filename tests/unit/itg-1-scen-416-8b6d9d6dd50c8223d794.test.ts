jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

import {
  retrieveUserInformationConfirmationStatus,
  LeaderAuthorizationError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;

describe('SCEN-416: LeaderAuthorizationError when leader lacks authority', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderAuthorizationError with correct message when leader lacks authority', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('チームリーダーの権限確認に失敗しました。')
    );

    const input = {
      leaderUserId: 'invalid-leader-id',
      retrievalTimestamp: new Date(),
    };

    try {
      await retrieveUserInformationConfirmationStatus(input);
      fail('Should have thrown LeaderAuthorizationError');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderAuthorizationError);
      expect((error as Error).message).toBe('チームリーダーの権限確認に失敗しました。');
    }
  });
});
