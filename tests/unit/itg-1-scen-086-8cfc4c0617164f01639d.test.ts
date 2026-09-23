import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserNotRegisteredAsReporterException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-086: 報告者マスタに登録されていないユーザーがアクセスを試みるとUserNotRegisteredAsReporterExceptionが発生', () => {
  it('should throw UserNotRegisteredAsReporterException when user is not registered in reporter master', () => {
    // テスト用のユーザーID（例：'reporter-001'）とisAuthenticated=trueを入力値として準備する
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // スタブ validateUserAccountActiveStatus を、戻り値 { isActive: true } で設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: true });

    // スタブ validateUserHasReporterRole を、戻り値 { hasRole: true } で設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole')
      .mockReturnValue({ hasRole: true });

    // authenticateAndAuthorizeReporterAccess に上記の入力値を渡して呼び出す際に、UserNotRegisteredAsReporterException が発生することを確認
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserNotRegisteredAsReporterException);

    // エラーメッセージが『このユーザーは日報提出対象として登録されていません。』
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('このユーザーは日報提出対象として登録されていません。');
  });
});
