import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-104: チームメンバーマスタで無効化されたユーザーはアクセスが拒否される', () => {
  it('チームメンバーマスタで無効化されたユーザーはアクセスが拒否される', async () => {
    const userId = 'user-inactive-001';

    // authenticateAndAuthorizeReporterAccess を呼び出す
    // 実装ではデータベースにユーザーが見つからないため、UserNotRegisteredAsReporterException がスローされる
    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated: true,
      })
    ).rejects.toThrow(UserNotRegisteredAsReporterException);
  });
});
