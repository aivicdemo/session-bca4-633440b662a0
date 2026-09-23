import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  NotAuthenticatedError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-106: ログイン状態にないユーザーがアクセスを試みると、NotAuthenticatedError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isAuthenticated が false のとき NotAuthenticatedError がスローされる', async () => {
    const userId = 'user-001';
    const isAuthenticated = false;

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow(NotAuthenticatedError);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow('ログインが必要です。');
  });
});
