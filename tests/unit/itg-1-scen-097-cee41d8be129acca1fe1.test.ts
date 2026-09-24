jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;

describe('SCEN-097: 報告者が無効化されているとき拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput): Promise<AuthenticateReporterAccessOutput> => {
        return {
          isAccessGranted: false,
          userId: input.userId,
          denialReason: 'UserAccountInactiveException',
        };
      }
    );
  });

  it('ユーザーアカウントが無効化されているとき拒否される', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    const result: AuthenticateReporterAccessOutput = await mockedAuthenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBe('UserAccountInactiveException');
  });
});
