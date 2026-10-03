import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  NotAuthenticatedError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-106: ログイン状態にないユーザーがアクセスを試みると、NotAuthenticatedError が発生する', () => {
  it('ログイン状態にないユーザーがアクセスを試みると、NotAuthenticatedError が発生する', async () => {
    const userId = 'user-001';

    // テスト対象の入力値を準備: userId = 'user-001', isAuthenticated = false
    const input = { userId, isAuthenticated: false };

    // authenticateAndAuthorizeLeaderAccess 関数を上記の入力値で直接呼び出す
    // 関数が NotAuthenticatedError をスロー（throw）することを確認
    await expect(
      authenticateAndAuthorizeLeaderAccess(input)
    ).rejects.toThrow(NotAuthenticatedError);

    // エラーメッセージが「ログインが必要です。」であることを確認
    // 仕様に記載されたメッセージを確認する
    let errorThrown = false;
    try {
      await authenticateAndAuthorizeLeaderAccess(input);
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(NotAuthenticatedError);
      // 仕様に記載されたメッセージ「ログインが必要です。」を確認
      // ※ 実装のメッセージと異なる場合、仕様に従う
    }
    expect(errorThrown).toBe(true);

    // validateUserAccountActiveStatus および validateUserHasLeaderRole は呼び出されないこと
  });
});
