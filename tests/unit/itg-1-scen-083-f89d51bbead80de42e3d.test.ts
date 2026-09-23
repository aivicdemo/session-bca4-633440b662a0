import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotAuthenticatedException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-083: ログインしていないユーザーがアクセスを試みるとUserNotAuthenticatedExceptionが発生', () => {
  it('should throw UserNotAuthenticatedException when user is not authenticated', () => {
    // 入力値として以下を指定する: { userId: 'reporter001', isAuthenticated: false }
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter001',
      isAuthenticated: false,
    };

    // 関数を実行する
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserNotAuthenticatedException);

    // エラーメッセージが『ユーザーがログインしていません。ログイン画面へ遷移してください。』である
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('ユーザーがログインしていません。ログイン画面へ遷移してください。');
  });
});
