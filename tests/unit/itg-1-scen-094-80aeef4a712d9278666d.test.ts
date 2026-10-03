import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-094: チームIDが空または不正なときUserNotRegisteredAsReporterExceptionが発生する', () => {
  it('should throw UserNotRegisteredAsReporterException when team ID is invalid', async () => {
    const input = {
      userId: 'user123',
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
