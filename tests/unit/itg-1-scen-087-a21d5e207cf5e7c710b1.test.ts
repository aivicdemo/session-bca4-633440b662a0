import { describe, it, expect } from '@jest/globals';
import { authenticateAndAuthorizeReporterAccess, UserNotAuthenticatedException } from '../../src/logic/user-authentication-authorization';

describe('SCEN-087: ユーザーIDが空のときUserNotAuthenticatedExceptionが発生する', () => {
  it('should throw UserNotAuthenticatedException when userId is empty string', async () => {
    const input = {
      userId: '',
      isAuthenticated: true,
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
