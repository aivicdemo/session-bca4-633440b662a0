import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserLacksReporterRoleException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-091: 報告者ロール非保有のときアクセスが拒否される', () => {
  it('should deny access when user does not have reporter role', async () => {
    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    try {
      await authenticateAndAuthorizeReporterAccess(input);
      throw new Error('Expected UserLacksReporterRoleException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UserLacksReporterRoleException);
      expect((error as UserLacksReporterRoleException).message).toBe('日報入力画面へのアクセス権限がありません。');
    }
  });
});
