jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

import type {
  RetrieveUserInformationConfirmationStatusInput,
  RetrieveUserInformationConfirmationStatusOutput,
} from '../../src/logic/user-information-input-confirmation';
import {
  retrieveUserInformationConfirmationStatus,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;

describe('SCEN-418: 対象ユーザー情報が存在しない場合、各カテゴリが空配列で返され、totalCountが0になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('各カテゴリが空配列で返され、totalCountが0になる', async () => {
    const leaderUserId = 'leader-001';
    const retrievalTimestamp = new Date('2026-09-24T10:00:00Z');

    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: leaderUserId,
    });

    const input: RetrieveUserInformationConfirmationStatusInput = {
      leaderUserId,
      retrievalTimestamp,
    };

    const result = await retrieveUserInformationConfirmationStatus(input) as RetrieveUserInformationConfirmationStatusOutput;

    expect(result.success).toBe(true);
    expect(result.pendingApprovals).toHaveLength(0);
    expect(result.approvedRecords).toHaveLength(0);
    expect(result.expiredApprovals).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});
