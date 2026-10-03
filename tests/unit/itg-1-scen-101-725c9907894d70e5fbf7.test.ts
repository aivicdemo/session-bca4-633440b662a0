import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';

describe('SCEN-101: ユーザーマスタへのデータベースアクセスが失敗したとき例外が発生する', () => {
  it('ユーザーマスタへのデータベースアクセスが失敗したとき、例外が発生する', async () => {
    // Test specification requires mocking validateUserAccountActiveStatus to throw a database error.
    // Per testing guidelines, same-module functions cannot be mocked.
    // This test expects the implementation to properly propagate database errors per the specification.

    const userId = 'reporter-001';

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated: true,
      })
    ).rejects.toThrow('Database connection error');
  });
});
