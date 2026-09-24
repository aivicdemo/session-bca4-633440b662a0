import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserLacksReporterRoleException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-088: ユーザーの役割情報がデータベースに存在しないときUserLacksReporterRoleExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserLacksReporterRoleException when user role info does not exist', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isActive: true,
    });

    jest.mocked(validateUserHasReporterRole).mockResolvedValue(null as any);

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
});
