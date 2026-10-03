import {
  authenticateAndAuthorizeReporterAccess,
  UserAccountInactiveException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-097: 報告者が無効化されているとき拒否される', () => {
  it('ユーザーアカウントが無効化されているとき拒否される', async () => {
    // Test specification requires mocking validateUserAccountActiveStatus to return { isActive: false }
    // for an inactive account. Per testing guidelines, same-module functions cannot be mocked.
    // This test expects the implementation to handle inactive accounts per the specification.

    const userId = 'reporter-001';

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated: true,
      })
    ).rejects.toThrow(UserAccountInactiveException);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated: true,
      })
    ).rejects.toThrow('このアカウントは無効化されています。管理者に問い合わせてください。');
  });
});
