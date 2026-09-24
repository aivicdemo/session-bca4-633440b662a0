jest.mock('../../src/logic/user-authentication-authorization', () => {
  const actual = jest.requireActual('../../src/logic/user-authentication-authorization');
  return {
    ...actual,
    validateUserAccountActiveStatus: jest.fn(),
  };
});

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
} from '../../src/logic/user-authentication-authorization';

const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;

describe('SCEN-101: ユーザーマスタへのデータベースアクセスが失敗したとき例外が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('ユーザーマスタへのデータベースアクセスが失敗したときに、例外メッセージに「システムエラーが発生しました。管理者に連絡してください」が含まれる', async () => {
    // 呼び出し先処理 validateUserAccountActiveStatus をスタブ化し、
    // データベース接続エラーをシミュレートする例外を発生させるように設定する
    const dbError = new Error('システムエラーが発生しました。管理者に連絡してください');
    mockedValidateUserAccountActiveStatus.mockRejectedValueOnce(dbError);

    // 入力値を準備する：userId = 'reporter-001'、isAuthenticated = true
    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // authenticateAndAuthorizeReporterAccess(userId, isAuthenticated) を呼び出す
    // 呼び出し先処理 validateUserAccountActiveStatus がデータベースエラーをスロー時、
    // 例外がそのまま伝播することを確認する
    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'システムエラーが発生しました。管理者に連絡してください'
    );
  });
});
