import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-100: チームIDが空または不正な形式のとき例外が発生する', () => {
  it('チームID不正時、UserNotRegisteredAsReporterException例外が発生する', async () => {
    // Test specification requires mocking validateUserHasReporterRole to throw UserNotRegisteredAsReporterException
    // when team ID is invalid. Per testing guidelines, same-module functions cannot be mocked.
    // This test expects the implementation to handle invalid team IDs per the specification.

    const userId = 'user123';

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
