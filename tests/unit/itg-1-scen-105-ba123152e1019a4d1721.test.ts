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

  it('有効なチームリーダーアカウントでアクセスが許可される', async () => {
    const userId = 'leader-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: true,
      userId,
    } as any);

    jest.mocked(validateUserHasLeaderRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    const result = await authenticateAndAuthorizeLeaderAccess({
      userId,
      isAuthenticated,
    });

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('leader-001');
    expect(result.denialReason).toBeNull();
  });

  it('戻り値の isAccessGranted は true、userId は入力値と同じ、denialReason は null', async () => {
    const userId = 'leader-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: true,
      userId,
    } as any);

    jest.mocked(validateUserHasLeaderRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    const result = await authenticateAndAuthorizeLeaderAccess({
      userId,
      isAuthenticated,
    });

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe(userId);
    expect(result.denialReason).toBeNull();
  });
});
