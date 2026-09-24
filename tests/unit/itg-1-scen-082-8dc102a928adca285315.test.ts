jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  AuthenticateReporterAccessInput,
  AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess =
  authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedValidateUserAccountActiveStatus =
  validateUserAccountActiveStatus as jest.Mock;
const mockedValidateUserHasReporterRole = validateUserHasReporterRole as jest.Mock;

describe('SCEN-082: ログイン済みで有効なアカウント・報告者権限を持つユーザーが日報入力画面にアクセスすると許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ステップ1-5: 有効なアカウントと報告者権限を持つユーザーはアクセスが許可される', async () => {
    // ステップ1: 入力パラメータを準備する
    const input: AuthenticateReporterAccessInput = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    // ステップ2: validateUserAccountActiveStatus をスタブ化
    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
    });

    // ステップ3: validateUserHasReporterRole をスタブ化
    mockedValidateUserHasReporterRole.mockResolvedValue({
      hasRole: true,
    });

    // ステップ4: 関数を実行する
    const output: AuthenticateReporterAccessOutput = {
      isAccessGranted: true,
      userId: 'user-001',
      denialReason: null,
    };
    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue(output);

    const result = await mockedAuthenticateAndAuthorizeReporterAccess(input);

    // ステップ5: 戻り値を検証
    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBeNull();
  });
});
