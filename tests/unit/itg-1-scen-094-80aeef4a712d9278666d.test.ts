import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-094: チームIDが空または不正なときUserNotRegisteredAsReporterExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotRegisteredAsReporterException when team ID is invalid', async () => {
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'user123',
    });

    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: true,
      userId: 'user123',
    });

    const input = {
      userId: 'user123',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserNotRegisteredAsReporterException);

    try {
      await authenticateAndAuthorizeReporterAccess(input);
    } catch (error) {
      if (error instanceof UserNotRegisteredAsReporterException) {
        expect(error.message).toBe('このユーザーは日報提出対象として登録されていません。');
      }
    }
  });
});
