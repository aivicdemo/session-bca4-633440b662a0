import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';

describe('SCEN-102: チームメンバーマスタに登録済みでアクティブなユーザーにアクセスが許可される', () => {
  it('チームメンバーマスタに登録済みでアクティブなユーザーにアクセスが許可される', async () => {
    // Test specification requires mocking validateUserAccountActiveStatus and validateUserHasReporterRole
    // to return { isActive: true } and { hasReporterRole: true } respectively for userId 'user-001'.
    // Per testing guidelines, same-module functions cannot be mocked.
    // This test expects the implementation to grant access for active registered users per the specification.

    const userId = 'user-001';

    const result = await authenticateAndAuthorizeReporterAccess({
      userId,
      isAuthenticated: true,
    });

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBeNull();
  });
});
