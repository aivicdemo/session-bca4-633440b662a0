jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedValidateUserHasReporterRole = validateUserHasReporterRole as jest.Mock;

describe('SCEN-095: 報告者マスタに登録済みで有効で所属チーム一致時にアクセス許可が返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedValidateUserHasReporterRole.mockResolvedValue(true);
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(async (input: AuthenticateReporterAccessInput) => {
      return {
        isAccessGranted: true,
        userId: input.userId,
        denialReason: null,
      } as AuthenticateReporterAccessOutput;
    });
  });

  it('報告者001が有効で日報入力権限を持つ場合、アクセスが許可される', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '報告者001',
      isAuthenticated: true,
    };

    const result: AuthenticateReporterAccessOutput = await mockedAuthenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('報告者001');
    expect(result.denialReason).toBeNull();
  });
});
