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

  it('ユーザーアカウントが無効化されている場合、UserAccountInactiveError が発生する', async () => {
    jest.mocked(validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: false,
      userId: 'leader-001',
    });

    jest.mocked(validateUserHasLeaderRole as any).mockResolvedValue({
      hasLeaderRole: true,
      userId: 'leader-001',
    });

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId: 'leader-001', isAuthenticated: true })
    ).rejects.toThrow(UserAccountInactiveError);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId: 'leader-001', isAuthenticated: true })
    ).rejects.toThrow('ユーザーアカウントが無効です。');

    expect(validateUserHasLeaderRole).not.toHaveBeenCalled();
  });
});
