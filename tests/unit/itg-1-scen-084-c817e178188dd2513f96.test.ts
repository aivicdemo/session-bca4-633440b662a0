import { describe, it, expect } from '@jest/globals';
import { authenticateAndAuthorizeReporterAccess, UserAccountInactiveException } from '../../src/logic/user-authentication-authorization';

describe('SCEN-084: 無効化されたアカウントでアクセスを試みるとUserAccountInactiveExceptionが発生', () => {
  it('should throw UserAccountInactiveException when account is inactive', async () => {
    const input = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserAccountInactiveException);

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(
      'このアカウントは無効化されています。管理者に問い合わせてください。'
    );
  });
});
