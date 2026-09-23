import { describe, it, expect, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserLacksReporterRoleException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-085: 報告者ロールを持たないユーザーがアクセスを試みるとUserLacksReporterRoleExceptionが発生', () => {
  it('should throw UserLacksReporterRoleException when user lacks reporter role', () => {
    // authenticateAndAuthorizeReporterAccessの入力値を準備
    const input: AuthenticateReporterAccessInput = {
      userId: 'user-002',
      isAuthenticated: true,
    };

    // validateUserAccountActiveStatusをスタブ化: エラーを発生させないよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus')
      .mockReturnValue({ isActive: true });

    // validateUserHasReporterRoleをスタブ化: UserLacksReporterRoleExceptionをthrowするよう設定
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole')
      .mockImplementation(() => {
        throw new UserLacksReporterRoleException();
      });

    // authenticateAndAuthorizeReporterAccessを呼び出す
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow(UserLacksReporterRoleException);

    // エラー文言『日報入力画面へのアクセス権限がありません。』を含む
    expect(() => {
      authenticateAndAuthorizeReporterAccess(input);
    }).toThrow('日報入力画面へのアクセス権限がありません。');
  });
});
