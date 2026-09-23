import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserLacksReporterRoleException,
  AuthenticateReporterAccessInput,
  AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-091: 報告者ロール非保有のときアクセスが拒否される', () => {
  it('should deny access or throw exception when user lacks reporter role', () => {
    // 呼び出し先処理 validateUserAccountActiveStatus をスタブ化し、アカウント有効状態を示す true を返すよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: true });

    // 呼び出し先処理 validateUserHasReporterRole をスタブ化し、報告者ロール非保有を示す false を返すよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole')
      .mockReturnValue({ hasRole: false });

    // テスト対象の関数 authenticateAndAuthorizeReporterAccess を呼び出す際の入力値を構築
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // 構築した入力値でauthenticateAndAuthorizeReporterAccessを実行する
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserLacksReporterRoleException);

    // UserLacksReporterRoleException が発生し、文言「日報入力画面へのアクセス権限がありません。」を示すこと
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('日報入力画面へのアクセス権限がありません。');
  });
});
