import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-096: 報告者マスタに未登録のとき拒否される', () => {
  it('ユーザーが報告者マスタに未登録の場合、UserNotRegisteredAsReporterExceptionが発生する', async () => {
    // Test specification requires mocking validateUserHasReporterRole to throw UserNotFoundError
    // when the user is not registered in the reporter master.
    // Per testing guidelines, same-module functions cannot be mocked.
    // This test expects the implementation to handle unregistered users per the specification.

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
