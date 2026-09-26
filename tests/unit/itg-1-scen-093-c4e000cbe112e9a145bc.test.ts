import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-093: 報告者マスタが空のときUserNotRegisteredAsReporterExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotRegisteredAsReporterException when reporter master is empty', async () => {
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'reporter001',
    });

    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: true,
      userId: 'reporter001',
    });

    const input = {
      userId: 'reporter001',
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
