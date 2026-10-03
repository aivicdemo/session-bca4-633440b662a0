import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-093: 報告者マスタが空のときUserNotRegisteredAsReporterExceptionが発生する', () => {
  it('should throw UserNotRegisteredAsReporterException when reporter master is empty', async () => {
    const input = {
      userId: 'reporter001',
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
