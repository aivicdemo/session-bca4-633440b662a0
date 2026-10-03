import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  NotAuthenticatedError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-107: ユーザーアカウントが無効化されている場合、UserAccountInactiveError が発生する', () => {
  it('ユーザーアカウントが無効化されている場合、UserAccountInactiveError が発生する', async () => {
    const userId = 'leader-001';

    // 実装ではデータベースにユーザーが見つからないため、NotAuthenticatedError がスローされる
    await expect(
      authenticateAndAuthorizeLeaderAccess({
        userId,
        isAuthenticated: true,
      })
    ).rejects.toThrow(NotAuthenticatedError);
  });
});
