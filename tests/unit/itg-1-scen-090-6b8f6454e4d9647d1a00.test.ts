import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  UserAccountInactiveException,
  AuthenticateReporterAccessInput,
  AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-090: 無効アカウントのときアクセスが拒否される', () => {
  it('should deny access or throw exception when account is inactive', () => {
    // ユーザーアカウントが無効な状態を前提とする
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: false });

    // authenticateAndAuthorizeReporterAccessの入力値として以下を設定
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // authenticateAndAuthorizeReporterAccessを呼び出す
    // 期待結果では例外がスロー対象となった場合のエラー文言も提示されているため、例外を確認
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserAccountInactiveException);

    // エラー文言が「このアカウントは無効化されています。管理者に問い合わせてください。」である
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('このアカウントは無効化されています。管理者に問い合わせてください。');
  });
});
