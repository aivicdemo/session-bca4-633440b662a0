jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserAccountInactiveException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess =
  authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedValidateUserAccountActiveStatus =
  validateUserAccountActiveStatus as jest.Mock;
const mockedValidateUserHasReporterRole = validateUserHasReporterRole as jest.Mock;

describe('SCEN-084: 無効化されたアカウントでアクセスを試みるとUserAccountInactiveExceptionが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('無効化されたアカウントでアクセスを試みると、UserAccountInactiveExceptionが発生する', async () => {
    // テスト用の入力値を準備する
    const input: AuthenticateReporterAccessInput = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    // validateUserAccountActiveStatus スタブを設定：ユーザーアカウントが無効化状態
    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: false,
    });

    // validateUserHasReporterRole スタブを設定：報告者ロール保有
    mockedValidateUserHasReporterRole.mockResolvedValue({
      hasRole: true,
    });

    // 無効化されたアカウントのため例外が発生
    const error = new UserAccountInactiveException(
      'このアカウントは無効化されています。管理者に問い合わせてください。'
    );
    mockedAuthenticateAndAuthorizeReporterAccess.mockRejectedValue(error);

    // 関数を実行して例外が発生することを確認
    await expect(
      mockedAuthenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserAccountInactiveException);

    // エラーメッセージを検証
    await expect(
      mockedAuthenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'このアカウントは無効化されています。管理者に問い合わせてください。'
    );
  });
});
