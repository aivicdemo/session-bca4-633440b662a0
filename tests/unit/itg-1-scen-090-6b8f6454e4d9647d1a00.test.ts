import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserAccountInactiveException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-090: 無効アカウントのときアクセスが拒否される', () => {
  it('should throw UserAccountInactiveException when account is inactive', async () => {
    // 前提：無効アカウントのユーザーID 'reporter-001' でログイン状態
    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // 期待結果：UserAccountInactiveException がスロー
    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(UserAccountInactiveException);

    // 期待結果：エラーメッセージが正確
    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'このアカウントは無効化されています。管理者に問い合わせてください。'
    );
  });
});
