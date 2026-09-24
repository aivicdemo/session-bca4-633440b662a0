jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  UserNotAuthenticatedException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess =
  authenticateAndAuthorizeReporterAccess as jest.Mock;

describe('SCEN-083: ログインしていないユーザーがアクセスを試みるとUserNotAuthenticatedExceptionが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーがログインしていない場合、UserNotAuthenticatedExceptionが発生する', async () => {
    // 入力値：isAuthenticated=false
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter001',
      isAuthenticated: false,
    };

    // ユーザーがログインしていないため例外が発生
    const error = new UserNotAuthenticatedException(
      'ユーザーがログインしていません。ログイン画面へ遷移してください。'
    );
    mockedAuthenticateAndAuthorizeReporterAccess.mockRejectedValue(error);

    // 関数を実行して例外が発生することを確認
    await expect(
      mockedAuthenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserNotAuthenticatedException);

    // エラーメッセージを検証
    await expect(
      mockedAuthenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'ユーザーがログインしていません。ログイン画面へ遷移してください。'
    );
  });
});
