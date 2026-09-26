import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  validateUserAccountActiveStatus,
  validateUserHasLeaderRole,
  InsufficientPermissionError,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-108: ログイン済みだがリーダー権限を持たないユーザーがアクセスを試みると、InsufficientPermissionError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログイン済みだがリーダー権限を持たないユーザーがアクセスを試みると、InsufficientPermissionError が発生する', async () => {
    jest.mocked(validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: true,
      userId: 'user-002',
    });

    jest.mocked(validateUserHasLeaderRole as any).mockResolvedValue({
      hasLeaderRole: false,
      userId: 'user-002',
    });

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId: 'user-002', isAuthenticated: true })
    ).rejects.toThrow(InsufficientPermissionError);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId: 'user-002', isAuthenticated: true })
    ).rejects.toThrow('管理画面へのアクセス権限がありません。');
  });
});
