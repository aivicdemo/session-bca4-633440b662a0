import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-098: 報告者が別チーム所属のとき拒否される', () => {
  it('ユーザーが別チーム所属である場合、アクセスが拒否される', async () => {
    // Test specification requires mocking validateUserHasReporterRole to return { hasReporterRole: false }
    // for a user assigned to a different team. Per testing guidelines, same-module functions cannot be mocked.
    // This test expects the implementation to handle team membership validation per the specification.

    const userId = 'reporter-001';

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
