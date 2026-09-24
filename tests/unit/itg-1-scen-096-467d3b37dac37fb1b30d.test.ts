jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;

describe('SCEN-096: 報告者マスタに未登録のとき拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput): Promise<AuthenticateReporterAccessOutput> => {
        return {
          isAccessGranted: false,
          userId: input.userId,
          denialReason: 'このユーザーは日報提出対象として登録されていません。',
        };
      }
    );
  });

  it('報告者マスタに未登録のとき拒否される', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    const result: AuthenticateReporterAccessOutput = await mockedAuthenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBe('このユーザーは日報提出対象として登録されていません。');
  });
});
