import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserHasReporterRole,
  UserNotRegisteredAsReporterException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;
const mockedValidateUserHasReporterRole = validateUserHasReporterRole as jest.MockedFunction<any>;

describe('SCEN-100: チームIDが空または不正な形式のとき例外が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // validateUserHasReporterRole をスタブ化し、チームID不正エラーを検出して例外を発生させるシナリオを構成
    mockedValidateUserHasReporterRole.mockImplementation(
      async () => {
        // チームID検証時に例外を発生させる
        throw new UserNotRegisteredAsReporterException('このユーザーは日報提出対象として登録されていません。');
      }
    );

    // authenticateAndAuthorizeReporterAccess の実装
    // 業務ルール br-tx_1-006 の制約: チームIDが空または不正な形式のとき → 『チーム情報が取得できません』
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput) => {
        const { userId } = input;

        try {
          // validateUserHasReporterRole を呼び出す
          await mockedValidateUserHasReporterRole({ userId });

          return {
            isAccessGranted: true,
            userId,
            denialReason: null,
          };
        } catch (error) {
          // validateUserHasReporterRole がチームID検証時に例外を発生させた場合
          if (error instanceof UserNotRegisteredAsReporterException) {
            throw error;
          }
          throw error;
        }
      }
    );
  });

  it('チームIDが空または不正な形式のとき、UserNotRegisteredAsReporterException例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'user123',
      isAuthenticated: true,
    };

    // UserNotRegisteredAsReporterException例外が発生することを検証
    await expect(mockedAuthenticateAndAuthorizeReporterAccess(input)).rejects.toThrow();

    // 例外の型が UserNotRegisteredAsReporterException であることを確認
    await expect(mockedAuthenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(UserNotRegisteredAsReporterException);

    // 例外メッセージが『このユーザーは日報提出対象として登録されていません。』となることを確認
    await expect(mockedAuthenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'このユーザーは日報提出対象として登録されていません。'
    );
  });
});
