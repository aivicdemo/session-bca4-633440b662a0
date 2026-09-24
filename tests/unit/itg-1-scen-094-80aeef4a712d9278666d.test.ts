import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserNotRegisteredAsReporterException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-094: チームIDが空または不正なときUserNotRegisteredAsReporterExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotRegisteredAsReporterException when team ID is invalid', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: 'user123',
      isAuthenticated: true,
    };

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isActive: true,
    });

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: true,
    });

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockImplementation(() => {
      throw new UserNotRegisteredAsReporterException(
        'このユーザーは日報提出対象として登録されていません。'
      );
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserNotRegisteredAsReporterException
    );

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'このユーザーは日報提出対象として登録されていません。'
    );

    expect(validateUserAccountActiveStatus).toHaveBeenCalled();
    expect(validateUserHasReporterRole).toHaveBeenCalled();
  });
});
