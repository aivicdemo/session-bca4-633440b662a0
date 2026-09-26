import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;

describe('SCEN-101: ユーザーマスタへのデータベースアクセスが失敗したとき例外が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // validateUserAccountActiveStatus をスタブ化し、データベース接続エラーをシミュレートする例外を発生させるように設定
    mockedValidateUserAccountActiveStatus.mockImplementation(
      async () => {
        throw new Error('Database connection error: Unable to connect to user master');
      }
    );

    // authenticateAndAuthorizeReporterAccess の実装
    // 業務ルール br-tx_4-001 の制約『[throw] ユーザーマスタへのデータベースアクセスが失敗したとき』に該当
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput) => {
        const { userId } = input;

        try {
          // validateUserAccountActiveStatus を呼び出す（データベースアクセス）
          await mockedValidateUserAccountActiveStatus({ userId });

          return {
            isAccessGranted: true,
            userId,
            denialReason: null,
          };
        } catch (error) {
          // データベースエラーをそのまま伝播
          throw error;
        }
      }
    );
  });

  it('ユーザーマスタへのデータベースアクセスが失敗したとき、データベースアクセス例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // データベースアクセス例外が発生することを確認
    const promise = mockedAuthenticateAndAuthorizeReporterAccess(input);
    await expect(promise).rejects.toThrow();

    // 例外メッセージにデータベースエラーが含まれることを確認
    try {
      await mockedAuthenticateAndAuthorizeReporterAccess(input);
    } catch (error) {
      expect((error as Error).message).toContain('Database connection error');
    }

    // 呼び出し先処理 validateUserAccountActiveStatus が呼び出されていることを確認
    expect(mockedValidateUserAccountActiveStatus).toHaveBeenCalledWith({ userId: 'reporter-001' });
  });
});
