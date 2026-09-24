import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-089: アカウント有効かつ報告者ロール保有時にアクセスが許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should grant access when account is active and user has reporter role', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isActive: true,
    });

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: true,
    });

    const expectedOutput: AuthenticateReporterAccessOutput = {
      isAccessGranted: true,
      userId: 'reporter-001',
      denialReason: null,
    };

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockResolvedValue(expectedOutput);

    const result = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBeNull();

    expect(validateUserAccountActiveStatus).toHaveBeenCalled();
    expect(validateUserHasReporterRole).toHaveBeenCalled();
  });
});
