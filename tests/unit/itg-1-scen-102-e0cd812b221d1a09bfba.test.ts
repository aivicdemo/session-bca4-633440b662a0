import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-102: チームメンバーマスタに登録済みでアクティブなユーザーにアクセスが許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームメンバーマスタに登録済みでアクティブなユーザーにアクセスが許可される', async () => {
    jest.mocked(validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: true,
      userId: 'user-001',
    });

    jest.mocked(validateUserHasReporterRole as any).mockResolvedValue({
      hasReporterRole: true,
      userId: 'user-001',
    });

    const input = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    const result = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBeNull();

    expect(validateUserAccountActiveStatus).toHaveBeenCalledWith({ userId: 'user-001' });
    expect(validateUserHasReporterRole).toHaveBeenCalledWith({ userId: 'user-001' });
  });
});
