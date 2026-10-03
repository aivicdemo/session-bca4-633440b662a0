import {
  authenticateAndAuthorizeReporterAccess,
  UserNotAuthenticatedException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-099: ユーザーIDが空または不正な形式のとき例外が発生する', () => {
  it('ユーザーIDが空文字列のとき例外が発生する', async () => {
    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId: '',
        isAuthenticated: true,
      })
    ).rejects.toThrow(UserNotAuthenticatedException);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId: '',
        isAuthenticated: true,
      })
    ).rejects.toThrow('ユーザーがログインしていません。ログイン画面へ遷移してください。');
  });
});
