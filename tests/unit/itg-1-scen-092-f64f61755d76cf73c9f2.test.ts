import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-092: 報告者IDが空または不正な形式のときUserNotRegisteredAsReporterExceptionが発生する', () => {
  it('should throw UserNotRegisteredAsReporterException when userId is empty string', async () => {
    const input = {
      userId: '',
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

  it('should throw UserNotRegisteredAsReporterException when userId is invalid format (special characters)', async () => {
    const input = {
      userId: '!@#$%',
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
