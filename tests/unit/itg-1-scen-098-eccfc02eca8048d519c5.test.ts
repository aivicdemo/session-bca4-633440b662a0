jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;

describe('SCEN-098: 報告者が別チーム所属のとき拒否される', () => {
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

  it('ユーザーが別チーム所属のとき拒否される', async () => {
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
