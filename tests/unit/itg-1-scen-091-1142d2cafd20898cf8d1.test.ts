import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserLacksReporterRoleException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-091: 報告者ロール非保有のときアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deny access when user does not have reporter role', async () => {
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'reporter-001',
    });

    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: false,
      userId: 'reporter-001',
      denialReason: 'User lacks reporter role',
    });

    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserLacksReporterRoleException);

    try {
      await authenticateAndAuthorizeReporterAccess(input);
    } catch (error) {
      if (error instanceof UserLacksReporterRoleException) {
        expect(error.message).toBe('日報入力画面へのアクセス権限がありません。');
      }
    }
  });
});
