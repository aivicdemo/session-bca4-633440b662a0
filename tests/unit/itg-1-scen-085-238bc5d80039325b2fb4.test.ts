import * as userAuth from '../../src/logic/user-authentication-authorization';

describe('SCEN-085: 報告者ロールを持たないユーザーがアクセスを試みるとUserLacksReporterRoleExceptionが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者ロールを持たないユーザーがアクセスを試みると、UserLacksReporterRoleExceptionが発生する', async () => {
    // authenticateAndAuthorizeReporterAccessの入力値を準備：userId='user-002'、isAuthenticated=true
    const input = {
      userId: 'user-002',
      isAuthenticated: true,
    };

    // validateUserAccountActiveStatusをスタブ化：エラーを発生させずに戻る
    jest.spyOn(userAuth, 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'user-002',
      inactiveReason: null,
    });

    // validateUserHasReporterRoleをスタブ化：UserLacksReporterRoleExceptionをthrowするよう設定
    jest.spyOn(userAuth, 'validateUserHasReporterRole').mockImplementation(() => {
      throw new userAuth.UserLacksReporterRoleException('日報入力画面へのアクセス権限がありません。');
    });

    // 発生した例外をキャッチして検証
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(userAuth.UserLacksReporterRoleException);

    // エラーメッセージを検証
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      '日報入力画面へのアクセス権限がありません。'
    );
  });
});
