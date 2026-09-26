import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-089: アカウント有効かつ報告者ロール保有時にアクセスが許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should grant access when account is active and user has reporter role', async () => {
    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserAccountActiveStatus').mockResolvedValue({
      isActive: true,
      userId: 'reporter-001',
    });

    jest.spyOn(require('../../src/logic/user-authentication-authorization'), 'validateUserHasReporterRole').mockResolvedValue({
      hasReporterRole: true,
      userId: 'reporter-001',
    });

    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    const result = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBeNull();
  });
});
