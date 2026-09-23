import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserNotAuthenticatedException,
  UserAccountInactiveException,
  UserLacksReporterRoleException,
  UserNotRegisteredAsReporterException,
  AuthenticateReporterAccessInput,
  AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-082: ログイン済みで有効なアカウント・報告者権限を持つユーザーが日報入力画面にアクセスすると許可される', () => {
  it('should grant access when user is authenticated with valid account and reporter role', () => {
    // ステップ1: authenticateAndAuthorizeReporterAccess関数を呼び出す入力パラメータを準備する
    const input: AuthenticateReporterAccessInput = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    // ステップ2: validateUserAccountActiveStatus関数をスタブ化
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: true });

    // ステップ3: validateUserHasReporterRole関数をスタブ化
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole')
      .mockReturnValue({ hasRole: true });

    // ステップ4: authenticateAndAuthorizeReporterAccessを実行
    const result = authenticateAndAuthorizeReporterAccess(input) as AuthenticateReporterAccessOutput;

    // ステップ5: 戻り値の出力型AuthenticateReporterAccessOutputのフィールドを検証する
    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBeNull();
  });
});
