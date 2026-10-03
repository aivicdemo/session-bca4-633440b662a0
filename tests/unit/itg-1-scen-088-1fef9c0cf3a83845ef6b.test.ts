import { describe, it, expect } from '@jest/globals';
import { authenticateAndAuthorizeReporterAccess, UserLacksReporterRoleException } from '../../src/logic/user-authentication-authorization';

describe('SCEN-088: ユーザーの役割情報がデータベースに存在しないときUserLacksReporterRoleExceptionが発生する', () => {
  it('should throw UserLacksReporterRoleException when user role info does not exist in database', async () => {
    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserLacksReporterRoleException);

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow('日報入力画面へのアクセス権限がありません。');
  });
});
