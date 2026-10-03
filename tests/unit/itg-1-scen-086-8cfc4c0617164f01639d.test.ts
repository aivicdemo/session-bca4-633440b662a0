import { describe, it, expect } from '@jest/globals';
import { authenticateAndAuthorizeReporterAccess, UserNotRegisteredAsReporterException } from '../../src/logic/user-authentication-authorization';

describe('SCEN-086: 報告者マスタに登録されていないユーザーがアクセスを試みるとUserNotRegisteredAsReporterExceptionが発生', () => {
  it('should throw UserNotRegisteredAsReporterException when user not registered as reporter', async () => {
    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserNotRegisteredAsReporterException);

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'このユーザーは日報提出対象として登録されていません。'
    );
  });
});
