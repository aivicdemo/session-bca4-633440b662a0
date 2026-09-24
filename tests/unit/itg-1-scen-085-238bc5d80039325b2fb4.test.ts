import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserLacksReporterRoleException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-085: 報告者ロールを持たないユーザーがアクセスを試みるとUserLacksReporterRoleExceptionが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserLacksReporterRoleException when user lacks reporter role', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'user-002',
      isAuthenticated: true,
    };

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isActive: true,
    });

    jest.mocked(validateUserHasReporterRole).mockImplementation(() => {
      throw new UserLacksReporterRoleException('日報入力画面へのアクセス権限がありません。');
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserLacksReporterRoleException
    );

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      '日報入力画面へのアクセス権限がありません。'
    );
  });
});
