import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotAuthenticatedException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-087: ユーザーIDが空のときUserNotAuthenticatedExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotAuthenticatedException when userId is empty string', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '',
      isAuthenticated: true,
    };

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockImplementation(() => {
      throw new UserNotAuthenticatedException(
        'ユーザーがログインしていません。ログイン画面へ遷移してください。'
      );
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserNotAuthenticatedException
    );

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'ユーザーがログインしていません。ログイン画面へ遷移してください。'
    );
  });
});
