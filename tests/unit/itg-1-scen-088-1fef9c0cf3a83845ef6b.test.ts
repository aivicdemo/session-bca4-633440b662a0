import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserLacksReporterRoleException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-088: ユーザーの役割情報がデータベースに存在しないときUserLacksReporterRoleExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserLacksReporterRoleException when user has no reporter role', async () => {
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: false,
      userId: 'reporter-001',
      denialReason: 'User does not have reporter role',
    });

    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'reporter-001',
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
