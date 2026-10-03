jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

import type { RetrieveUserInformationConfirmationStatusInput } from '../../src/logic/user-information-input-confirmation';
import {
  retrieveUserInformationConfirmationStatus,
  DataRetrievalError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;

describe('SCEN-417: ユーザー情報確認状態の取得処理がシステム障害で失敗した場合、DataRetrievalErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalError with correct message when system failure occurs', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader-001',
    });

    const input: RetrieveUserInformationConfirmationStatusInput = {
      leaderUserId: 'leader-001',
      retrievalTimestamp: new Date('2026-09-25T10:00:00Z'),
    };

    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(DataRetrievalError);
    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(
      'ユーザー情報確認状態の取得に失敗しました。'
    );
  });
});
