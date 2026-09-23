import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserLacksReporterRoleException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-088: ユーザーの役割情報がデータベースに存在しないときUserLacksReporterRoleExceptionが発生する', () => {
  it('should throw UserLacksReporterRoleException when user role information does not exist', () => {
    // テスト前提: validateUserHasReporterRole をスタブ化し、ユーザーの役割情報がデータベースに存在しない状態を返すよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole')
      .mockReturnValue(null);

    // テスト前提: validateUserAccountActiveStatus をスタブ化し、アカウントが有効な状態を返すよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: true });

    // 入力値を構築する
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // authenticateAndAuthorizeReporterAccess を呼び出す
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserLacksReporterRoleException);

    // 例外のメッセージは『日報入力画面へのアクセス権限がありません。』と一致する
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('日報入力画面へのアクセス権限がありません。');
  });
});
