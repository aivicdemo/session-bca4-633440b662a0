import * as userAuth from '../../src/logic/user-authentication-authorization';

describe('SCEN-086: 報告者マスタに登録されていないユーザーがアクセスを試みるとUserNotRegisteredAsReporterExceptionが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者マスタに登録されていないユーザーがアクセスを試みると、UserNotRegisteredAsReporterExceptionが発生する', async () => {
    // テスト用のユーザーID（例：'reporter-001'）とisAuthenticated=trueを入力値として準備
    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // スタブ validateUserAccountActiveStatus を、戻り値 { isActive: true } で設定
    jest.spyOn(userAuth, 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'reporter-001',
      inactiveReason: null,
    });

    // スタブ validateUserHasReporterRole を、戻り値 { hasReporterRole: true } で設定
    jest.spyOn(userAuth, 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: true,
      userId: 'reporter-001',
      denialReason: null,
    });

    // 関数を実行して例外が発生することを確認
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(userAuth.UserNotRegisteredAsReporterException);

    // エラーメッセージを検証
    await expect(
      userAuth.authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'このユーザーは日報提出対象として登録されていません。'
    );
  });
});
