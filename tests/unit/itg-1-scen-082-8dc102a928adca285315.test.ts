import * as userAuth from '../../src/logic/user-authentication-authorization';

describe('SCEN-082: ログイン済みで有効なアカウント・報告者権限を持つユーザーが日報入力画面にアクセスすると許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログイン済みで有効なアカウント、報告者ロール権限を持つユーザーがアクセス許可される', async () => {
    // ステップ1: 入力パラメータを準備する
    const input = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    // ステップ2: validateUserAccountActiveStatus をスタブ化
    jest.spyOn(userAuth, 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'user-001',
      inactiveReason: null,
    });

    // ステップ3: validateUserHasReporterRole をスタブ化
    jest.spyOn(userAuth, 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: true,
      userId: 'user-001',
      denialReason: null,
    });

    // ステップ4: 関数を実行する
    const result = await userAuth.authenticateAndAuthorizeReporterAccess(input);

    // ステップ5: 戻り値を検証
    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBeNull();
  });
});
