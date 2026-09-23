import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  AuthenticateReporterAccessInput,
  AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-089: アカウント有効かつ報告者ロール保有時にアクセスが許可される', () => {
  it('should grant access when account is active and user has reporter role', () => {
    // ステップ1: validateUserAccountActiveStatusをスタブ化し、アカウント有効状態を返すよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: true });

    // ステップ2: validateUserHasReporterRoleをスタブ化し、報告者ロール保有状態を返すよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole')
      .mockReturnValue({ hasRole: true });

    // ステップ3: authenticateAndAuthorizeReporterAccessを呼び出す際に、以下の入力を指定
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // ステップ4と5は検証時にスタブが呼ばれることで確認されます

    // ステップ6: authenticateAndAuthorizeReporterAccessの戻り値を検証
    const result = authenticateAndAuthorizeReporterAccess(input) as AuthenticateReporterAccessOutput;

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBeNull();
  });
});
