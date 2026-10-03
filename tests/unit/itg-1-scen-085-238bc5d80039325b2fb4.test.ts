import { describe, it, expect } from '@jest/globals';
import { authenticateAndAuthorizeReporterAccess, UserLacksReporterRoleException } from '../../src/logic/user-authentication-authorization';

describe('SCEN-085: 報告者ロールを持たないユーザーがアクセスを試みるとUserLacksReporterRoleExceptionが発生', () => {
  it('should throw UserLacksReporterRoleException when user lacks reporter role', async () => {
    const input = {
      userId: 'user-002',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserLacksReporterRoleException);

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      '日報入力画面へのアクセス権限がありません。'
    );
  });
});
