import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  validateUserAccountActiveStatus,
  validateUserHasLeaderRole,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-105: ログイン済みのチームリーダーがリーダー権限を持つ場合、アクセスが許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログイン済みのチームリーダーがリーダー権限を持つ場合、アクセスが許可される', async () => {
    jest.mocked(validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: true,
      userId: 'leader-001',
    });

    jest.mocked(validateUserHasLeaderRole as any).mockResolvedValue({
      hasLeaderRole: true,
      userId: 'leader-001',
    });

    const result = await authenticateAndAuthorizeLeaderAccess({
      userId: 'leader-001',
      isAuthenticated: true,
    });

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('leader-001');
    expect(result.denialReason).toBeNull();

    expect(validateUserAccountActiveStatus).toHaveBeenCalledWith({ userId: 'leader-001' });
    expect(validateUserHasLeaderRole).toHaveBeenCalledWith({ userId: 'leader-001' });
  });
});
