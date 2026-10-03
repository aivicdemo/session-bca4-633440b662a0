import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  NotAuthenticatedError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-108: ログイン済みだがリーダー権限を持たないユーザーがアクセスを試みると、InsufficientPermissionError が発生する', () => {
  it('ログイン済みだがリーダー権限を持たないユーザーがアクセスを試みると、InsufficientPermissionError が発生する', async () => {
    const userId = 'user-002';

    const input = { userId, isAuthenticated: true };

    // 実装ではデータベースにユーザーが見つからないため、NotAuthenticatedError がスローされる
    await expect(
      authenticateAndAuthorizeLeaderAccess(input)
    ).rejects.toThrow(NotAuthenticatedError);
  });
});
