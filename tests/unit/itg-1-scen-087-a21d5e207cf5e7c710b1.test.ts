import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotAuthenticatedException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-087: ユーザーIDが空のときUserNotAuthenticatedExceptionが発生する', () => {
  it('should throw UserNotAuthenticatedException when userId is empty', () => {
    // authenticateAndAuthorizeReporterAccess 関数を呼び出す際に、AuthenticateReporterAccessInput の userId フィールドに空文字列 ('') を設定
    const input: AuthenticateReporterAccessInput = {
      userId: '',
      isAuthenticated: true,
    };

    // 関数を実行する
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserNotAuthenticatedException);

    // エラー文言「ユーザーがログインしていません。ログイン画面へ遷移してください。」が返される
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('ユーザーがログインしていません。ログイン画面へ遷移してください。');
  });
});
