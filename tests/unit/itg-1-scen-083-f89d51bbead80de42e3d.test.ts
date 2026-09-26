import * as userAuth from '../../src/logic/user-authentication-authorization';

describe('SCEN-083: ログインしていないユーザーがアクセスを試みるとUserNotAuthenticatedExceptionが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーがログインしていない場合、UserNotAuthenticatedExceptionが発生する', async () => {
    // 入力値を準備：isAuthenticatedフラグをfalseに設定
    const input = {
      userId: 'reporter001',
      isAuthenticated: false,
    };

    // 関数を実行して例外が発生することを確認
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(userAuth.UserNotAuthenticatedException);

    // エラーメッセージを検証
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'ユーザーがログインしていません。ログイン画面へ遷移してください。'
    );
  });
});
