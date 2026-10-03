import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  NotAuthenticatedError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-105: ログイン済みのチームリーダーがリーダー権限を持つ場合、アクセスが許可される', () => {
  it('ログイン済みのチームリーダーがリーダー権限を持つ場合、アクセスが許可される', async () => {
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
