import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  validateUserAccountActiveStatus,
  validateUserHasLeaderRole,
  UserAccountInactiveError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-107: ユーザーアカウントが無効化されている場合、UserAccountInactiveError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーアカウントが無効化されているとき UserAccountInactiveError がスローされる', async () => {
    const userId = 'leader-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: false,
      userId,
    } as any);

    jest.mocked(validateUserHasLeaderRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow(UserAccountInactiveError);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow('ユーザーアカウントが無効です。');
  });

  it('validateUserAccountActiveStatus が呼び出され、戻り値が無効化された状態を返す', async () => {
    const userId = 'leader-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: false,
      userId,
    } as any);

    jest.mocked(validateUserHasLeaderRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    try {
      await authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated });
    } catch {
      // Expected to throw
    }

    expect(validateUserHasLeaderRole).not.toHaveBeenCalled();
  });
});
