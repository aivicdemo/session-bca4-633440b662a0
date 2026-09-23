import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveUserInformationConfirmationStatus,
  LeaderAuthorizationError,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

describe('SCEN-416: チームリーダーの権限がない、またはアカウントが無効な場合、LeaderAuthorizationErrorが発生する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts').authenticateAndAuthorizeLeaderAccess;
  });

  it('チームリーダーの権限がない、またはアカウントが無効な場合、LeaderAuthorizationErrorが発生する', async () => {
    const input = {
      leaderUserId: 'invalid-leader',
      retrievalTimestamp: new Date(),
    };

    // リーダー権限がない状態を模擬する
    mockAuthenticateAndAuthorizeLeaderAccess.mockImplementation(() => {
      throw new LeaderAuthorizationError('チームリーダーの権限確認に失敗しました。');
    });

    // @ts-ignore
    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(LeaderAuthorizationError);

    // エラーメッセージを確認
    try {
      // @ts-ignore
      await retrieveUserInformationConfirmationStatus(input);
    } catch (error: any) {
      expect(error.message).toBe('チームリーダーの権限確認に失敗しました。');
    }
  });
});
