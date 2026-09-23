import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-099: ユーザーIDが空または不正な形式のとき例外が発生する', () => {
  it('userIdが空文字列のとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow();

    try {
      await authenticateAndAuthorizeReporterAccess(input);
    } catch (error) {
      const errorMessage = (error as Error).message;
      expect(
        errorMessage.includes('ユーザーIDが無効です。再度ログインしてください') ||
        errorMessage.includes('このユーザーは日報提出対象として登録されていません。')
      ).toBe(true);
    }
  });
});
