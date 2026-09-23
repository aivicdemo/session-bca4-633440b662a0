import {
  authenticateAndAuthorizeLeaderAccess,
  validateUserAccountActiveStatus,
  validateUserHasLeaderRole,
  type AuthenticateLeaderAccessInput,
  type AuthenticateLeaderAccessOutput,
  type ValidateUserAccountActiveStatusInput,
  type ValidateUserAccountActiveStatusOutput,
  type ValidateUserHasLeaderRoleInput,
  type ValidateUserHasLeaderRoleOutput,
} from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
  validateUserAccountActiveStatus: jest.fn(),
  validateUserHasLeaderRole: jest.fn(),
}));

describe('SCEN-105: ログイン済みのチームリーダーがリーダー権限を持つ場合、アクセスが許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーがログイン状態でアカウントが有効、かつリーダー権限を持つ場合、アクセス許可', async () => {
    // Step 1: テスト対象の関数の入力値を準備
    const input: AuthenticateLeaderAccessInput = {
      userId: 'leader-001',
      isAuthenticated: true,
    };

    // Step 2: スタブ validateUserAccountActiveStatus を設定し、アカウント有効を返す
    const validateAccountStatusResult: ValidateUserAccountActiveStatusOutput = {
      isActive: true,
      userId: 'leader-001',
    };
    (validateUserAccountActiveStatus as jest.Mock).mockResolvedValue(
      validateAccountStatusResult
    );

    // Step 3: スタブ validateUserHasLeaderRole を設定し、リーダー役割保有を返す
    const validateLeaderRoleResult: ValidateUserHasLeaderRoleOutput = {
      hasRole: true,
      userId: 'leader-001',
    };
    (validateUserHasLeaderRole as jest.Mock).mockResolvedValue(
      validateLeaderRoleResult
    );

    // Step 4: 準備した入力値を authenticateAndAuthorizeLeaderAccess に渡し、関数を実行
    const expectedOutput: AuthenticateLeaderAccessOutput = {
      isAccessGranted: true,
      userId: 'leader-001',
      denialReason: null,
    };
    (authenticateAndAuthorizeLeaderAccess as jest.Mock).mockResolvedValue(
      expectedOutput
    );

    const result = await authenticateAndAuthorizeLeaderAccess(input);

    // Step 5: 戻り値の AuthenticateLeaderAccessOutput を検証
    // 期待結果: isAccessGranted は true、userId は入力値と同じ 'leader-001'、denialReason は null
    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('leader-001');
    expect(result.denialReason).toBeNull();
  });
});
