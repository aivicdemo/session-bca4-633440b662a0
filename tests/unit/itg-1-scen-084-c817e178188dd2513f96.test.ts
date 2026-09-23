import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserAccountInactiveException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-084: 無効化されたアカウントでアクセスを試みるとUserAccountInactiveExceptionが発生', () => {
  it('should throw UserAccountInactiveException when account is inactive', () => {
    // テスト用の入力値を準備する
    const input: AuthenticateReporterAccessInput = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    // validateUserAccountActiveStatus スタブを設定：ユーザーアカウントが無効化された状態を返すよう構成
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: false });

    // validateUserHasReporterRole スタブを設定：報告者ロール保有状態を返すよう構成
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole')
      .mockReturnValue({ hasRole: true });

    // authenticateAndAuthorizeReporterAccess(入力値)を実行し、UserAccountInactiveException例外が発生することを確認
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserAccountInactiveException);

    // エラーメッセージが『このアカウントは無効化されています。管理者に問い合わせてください。』を含むこと
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('このアカウントは無効化されています。管理者に問い合わせてください。');
  });
});
