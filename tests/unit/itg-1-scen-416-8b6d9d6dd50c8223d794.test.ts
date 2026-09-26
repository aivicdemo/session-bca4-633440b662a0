jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

import {
  retrieveUserInformationConfirmationStatus,
  LeaderAuthorizationError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;

describe('SCEN-416: チームリーダーの権限がない、またはアカウントが無効な場合、LeaderAuthorizationErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームリーダーの権限がない場合、LeaderAuthorizationErrorが発生する', async () => {
    // Arrange: スタブ化し、リーダー権限がない状態を模擬
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('チームリーダーの権限確認に失敗しました。')
    );

    // Act & Assert
    const input = {
      leaderUserId: 'invalid-leader-id',
      retrievalTimestamp: new Date(),
    };

    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(LeaderAuthorizationError);
    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(
      'チームリーダーの権限確認に失敗しました。'
    );
  });

  it('チームリーダーのアカウントが無効な場合、LeaderAuthorizationErrorが発生する', async () => {
    // Arrange: スタブ化し、アカウントが無効な状態を模擬
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('チームリーダーの権限確認に失敗しました。')
    );

    // Act & Assert
    const input = {
      leaderUserId: 'disabled-leader-id',
      retrievalTimestamp: new Date(),
    };

    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(LeaderAuthorizationError);
    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(
      'チームリーダーの権限確認に失敗しました。'
    );
  });
});
