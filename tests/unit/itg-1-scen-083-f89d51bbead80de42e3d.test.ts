import { describe, it, expect } from '@jest/globals';
import { authenticateAndAuthorizeReporterAccess, UserNotAuthenticatedException } from '../../src/logic/user-authentication-authorization';

describe('SCEN-083: ログインしていないユーザーがアクセスを試みるとUserNotAuthenticatedExceptionが発生', () => {
  it('should throw UserNotAuthenticatedException when user is not authenticated', async () => {
    const input = {
      userId: 'reporter001',
      isAuthenticated: false,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserNotAuthenticatedException);

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'ユーザーがログインしていません。ログイン画面へ遷移してください。'
    );
  });
});
