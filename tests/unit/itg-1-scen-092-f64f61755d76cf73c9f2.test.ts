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

    try {
      await authenticateAndAuthorizeReporterAccess(input);
      throw new Error('Expected UserNotRegisteredAsReporterException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotRegisteredAsReporterException);
      expect((error as UserNotRegisteredAsReporterException).message).toBe('このユーザーは日報提出対象として登録されていません。');
    }
  });

  it('should throw UserNotRegisteredAsReporterException when userId is invalid format (special characters only)', async () => {
    const input = {
      userId: '!@#$%',
      isAuthenticated: true,
    };

    try {
      await authenticateAndAuthorizeReporterAccess(input);
      throw new Error('Expected UserNotRegisteredAsReporterException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotRegisteredAsReporterException);
      expect((error as UserNotRegisteredAsReporterException).message).toBe('このユーザーは日報提出対象として登録されていません。');
    }
  });

  it('should throw UserNotRegisteredAsReporterException when userId is invalid format (numbers and symbols)', async () => {
    const input = {
      userId: '12345!@#',
      isAuthenticated: true,
    };

    try {
      await authenticateAndAuthorizeReporterAccess(input);
      throw new Error('Expected UserNotRegisteredAsReporterException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotRegisteredAsReporterException);
      expect((error as UserNotRegisteredAsReporterException).message).toBe('このユーザーは日報提出対象として登録されていません。');
    }
  });
});
