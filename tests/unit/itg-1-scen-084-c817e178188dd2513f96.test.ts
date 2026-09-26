import * as userAuth from '../../src/logic/user-authentication-authorization';

describe('SCEN-084: 無効化されたアカウントでアクセスを試みるとUserAccountInactiveExceptionが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('無効化されたアカウントでアクセスを試みると、UserAccountInactiveExceptionが発生する', async () => {
    // テスト用の入力値を準備する：userId='user-001'、isAuthenticated=true
    const input = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    // validateUserAccountActiveStatus スタブを設定：ユーザーアカウントが無効化状態
    jest.spyOn(userAuth, 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: false,
      userId: 'user-001',
      inactiveReason: 'Account deactivated',
    });

    // validateUserHasReporterRole スタブを設定：報告者ロール保有
    jest.spyOn(userAuth, 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: true,
      userId: 'user-001',
      denialReason: null,
    });

    // 関数を実行して例外が発生することを確認
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(userAuth.UserAccountInactiveException);

    // エラーメッセージを検証
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'このアカウントは無効化されています。管理者に問い合わせてください。'
    );
  });
});
