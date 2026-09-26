import type {
  RetrieveUserInformationConfirmationStatusInput,
  RetrieveUserInformationConfirmationStatusOutput,
} from '../../src/logic/user-information-input-confirmation';
import {
  retrieveUserInformationConfirmationStatus,
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

describe('SCEN-418: 対象ユーザー情報が存在しない場合、各カテゴリが空配列で返され、totalCountが0になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('各カテゴリが空配列で返され、totalCountが0になる', () => {
    const mockAuthenticateAndAuthorizeLeaderAccess = userAuthModule.authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;

    const leaderUserId = 'leader-001';
    const retrievalTimestamp = new Date('2026-09-24T10:00:00Z');

    mockAuthenticateAndAuthorizeLeaderAccess.mockReturnValue({
      authorized: true,
    });

    const input: RetrieveUserInformationConfirmationStatusInput = {
      leaderUserId,
      retrievalTimestamp,
    };

    const result = retrieveUserInformationConfirmationStatus(input) as unknown as RetrieveUserInformationConfirmationStatusOutput;

    expect(result.success).toBe(true);
    expect(result.pendingApprovals).toHaveLength(0);
    expect(result.approvedRecords).toHaveLength(0);
    expect(result.expiredApprovals).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});
