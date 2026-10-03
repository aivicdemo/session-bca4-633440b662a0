import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-103: チームメンバーマスタに未登録のユーザーはアクセスが拒否される', () => {
  it('チームメンバーマスタに未登録のユーザーはアクセスが拒否される', async () => {
    // Test specification requires mocking validateUserHasReporterRole to return { hasReporterRole: false }
    // for an unregistered user. Per testing guidelines, same-module functions cannot be mocked.
    // This test expects the implementation to deny access for unregistered users per the specification.

    const userId = 'user-001';

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated: true,
      })
    ).rejects.toThrow(UserNotRegisteredAsReporterException);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated: true,
      })
    ).rejects.toThrow('このユーザーは日報提出対象として登録されていません。');
  });
});
