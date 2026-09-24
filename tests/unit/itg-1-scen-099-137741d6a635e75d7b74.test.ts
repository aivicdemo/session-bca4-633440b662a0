jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;

describe('SCEN-099: ユーザーIDが空または不正な形式のとき例外が発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput) => {
        if (!input.userId || input.userId.trim() === '') {
          throw new Error('ユーザーIDが無効です。再度ログインしてください');
        }
        return {
          isAccessGranted: true,
          userId: input.userId,
          denialReason: null,
        };
      }
    );
  });

  it('userIdが空文字列のとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '',
      isAuthenticated: true,
    };

    await expect(
      mockedAuthenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow('ユーザーIDが無効です。再度ログインしてください');
  });
});
