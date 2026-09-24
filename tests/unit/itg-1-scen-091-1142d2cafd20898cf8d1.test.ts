import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserLacksReporterRoleException,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-091: 報告者ロール非保有のときアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserLacksReporterRoleException when user lacks reporter role', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isActive: true,
    });

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: false,
    });

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockImplementation(() => {
      throw new UserLacksReporterRoleException(
        '日報入力画面へのアクセス権限がありません。'
      );
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserLacksReporterRoleException
    );

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      '日報入力画面へのアクセス権限がありません。'
    );
  });

  it('should return access denied output with UserLacksReporterRoleException reason', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    const expectedOutput: AuthenticateReporterAccessOutput = {
      isAccessGranted: false,
      userId: 'reporter-001',
      denialReason: 'UserLacksReporterRoleException - 日報入力画面へのアクセス権限がありません。',
    };

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockResolvedValue(expectedOutput);

    const result = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toContain('日報入力画面へのアクセス権限がありません。');
  });
});
