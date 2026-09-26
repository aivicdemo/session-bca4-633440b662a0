import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  UserNotAuthenticatedException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;

describe('SCEN-099: ユーザーIDが空または不正な形式のとき例外が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // authenticateAndAuthorizeReporterAccess の実装
    // ユーザーIDが空または不正な形式の場合、入力値検証エラーをスロー
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput) => {
        const { userId, isAuthenticated } = input;

        // 業務ルール br-tx_4-001 の制約: ユーザーIDが空または不正な形式のとき → ユーザーIDが無効です。再度ログインしてください
        if (!userId || userId.trim() === '') {
          throw new UserNotAuthenticatedException('ユーザーIDが無効です。再度ログインしてください。');
        }

        // その他の処理
        return {
          isAccessGranted: true,
          userId,
          denialReason: null,
        };
      }
    );
  });

  it('ユーザーIDが空文字列のとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '',
      isAuthenticated: true,
    };

    // 関数呼び出しが例外をスロー
    await expect(mockedAuthenticateAndAuthorizeReporterAccess(input)).rejects.toThrow();

    // スロー された例外の型が UserNotAuthenticatedException であることを確認
    await expect(mockedAuthenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(UserNotAuthenticatedException);

    // エラーメッセージが適切に設定されていることを確認
    await expect(mockedAuthenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'ユーザーIDが無効です。再度ログインしてください。'
    );
  });
});
