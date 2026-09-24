import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  UserAccountInactiveException,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-090: 無効アカウントのときアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserAccountInactiveException when account is inactive', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isActive: false,
    });

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockImplementation(() => {
      throw new UserAccountInactiveException(
        'このアカウントは無効化されています。管理者に問い合わせてください。'
      );
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserAccountInactiveException
    );

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'このアカウントは無効化されています。管理者に問い合わせてください。'
    );
  });

  it('should return access denied output when account is inactive', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    const expectedOutput: AuthenticateReporterAccessOutput = {
      isAccessGranted: false,
      userId: 'reporter-001',
      denialReason: 'account_inactive',
    };

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockResolvedValue(expectedOutput);

    const result = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBe('account_inactive');
  });
});
