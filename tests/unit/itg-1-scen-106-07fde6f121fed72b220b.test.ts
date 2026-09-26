import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  NotAuthenticatedError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-106: ログイン状態にないユーザーがアクセスを試みると、NotAuthenticatedError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログイン状態にないユーザーがアクセスを試みると、NotAuthenticatedError が発生する', async () => {
    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId: 'user-001', isAuthenticated: false })
    ).rejects.toThrow(NotAuthenticatedError);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId: 'user-001', isAuthenticated: false })
    ).rejects.toThrow('ログインが必要です。');
  });
});
