import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserAccountInactiveException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-090: 無効アカウントのときアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deny access when account is inactive', async () => {
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: false,
      userId: 'reporter-001',
      inactiveReason: 'account_inactive',
    });

    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    try {
      await authenticateAndAuthorizeReporterAccess(input);
      throw new Error('Expected UserAccountInactiveException to be thrown');
    } catch (error) {
      if (error instanceof UserAccountInactiveException) {
        expect(error.message).toBe('このアカウントは無効化されています。管理者に問い合わせてください。');
      } else {
        throw error;
      }
    }
  });
});
