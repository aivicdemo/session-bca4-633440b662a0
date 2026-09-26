import type { RetrieveUserInformationConfirmationStatusInput } from '../../src/logic/user-information-input-confirmation';
import {
  retrieveUserInformationConfirmationStatus,
  DataRetrievalError,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-information-input-confirmation', () => {
  const actualModule = jest.requireActual('../../src/logic/user-information-input-confirmation');
  return {
    ...actualModule,
    buildUserInformationConfirmationStatusList: jest.fn(),
  };
});

describe('SCEN-417: ユーザー情報確認状態の取得処理がシステム障害で失敗した場合、DataRetrievalErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalError with correct message when system failure occurs', () => {
    const mockAuthenticateAndAuthorizeLeaderAccess = userAuthModule.authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;

    mockAuthenticateAndAuthorizeLeaderAccess.mockReturnValue({
      authorized: true,
    });

    const input: RetrieveUserInformationConfirmationStatusInput = {
      leaderUserId: 'leader-001',
      retrievalTimestamp: new Date('2026-09-25T10:00:00Z'),
    };

    expect(() => {
      retrieveUserInformationConfirmationStatus(input);
    }).toThrow(DataRetrievalError);

    expect(() => {
      retrieveUserInformationConfirmationStatus(input);
    }).toThrow('ユーザー情報確認状態の取得に失敗しました。');
  });
});
