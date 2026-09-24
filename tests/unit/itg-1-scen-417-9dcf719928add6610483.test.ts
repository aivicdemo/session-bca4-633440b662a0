jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/user-information-input-confirmation', () => ({
  buildUserInformationConfirmationStatusList: jest.fn(),
}));

import {
  retrieveUserInformationConfirmationStatus,
  buildUserInformationConfirmationStatusList,
  DataRetrievalError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockedBuildUserInformationConfirmationStatusList = buildUserInformationConfirmationStatusList as jest.Mock;

describe('SCEN-417: DataRetrievalError when system failure occurs during status retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalError with correct message when system failure occurs', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    });
    mockedBuildUserInformationConfirmationStatusList.mockRejectedValue(
      new DataRetrievalError('ユーザー情報確認状態の取得に失敗しました。')
    );

    const input = {
      leaderUserId: 'leader-001',
      retrievalTimestamp: new Date(),
    };

    try {
      await retrieveUserInformationConfirmationStatus(input);
      fail('Should have thrown DataRetrievalError');
    } catch (error) {
      expect(error).toBeInstanceOf(DataRetrievalError);
      expect((error as Error).message).toBe('ユーザー情報確認状態の取得に失敗しました。');
    }
  });
});
