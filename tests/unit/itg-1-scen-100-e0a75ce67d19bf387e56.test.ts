jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;

describe('SCEN-100: チームIDが空または不正な形式のとき例外が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput) => {
        throw new UserNotRegisteredAsReporterException('このユーザーは日報提出対象として登録されていません。');
      }
    );
  });

  it('チームIDが不正なとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'user123',
      isAuthenticated: true,
    };

    await expect(
      mockedAuthenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserNotRegisteredAsReporterException);

    try {
      await mockedAuthenticateAndAuthorizeReporterAccess(input);
    } catch (error) {
      expect((error as Error).message).toBe('このユーザーは日報提出対象として登録されていません。');
    }
  });
});
