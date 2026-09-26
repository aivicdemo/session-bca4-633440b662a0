import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserAccountInactiveException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-104: チームメンバーマスタで無効化されたユーザーはアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームメンバーマスタで無効化されたユーザーはアクセスが拒否される', async () => {
    jest.mocked(validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: false,
      userId: 'user-001',
    });

    jest.mocked(validateUserHasReporterRole as any).mockResolvedValue({
      hasReporterRole: true,
      userId: 'user-001',
    });

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId: 'user-001',
        isAuthenticated: true,
      })
    ).rejects.toThrow(UserAccountInactiveException);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId: 'user-001',
        isAuthenticated: true,
      })
    ).rejects.toThrow('このアカウントは無効化されています。管理者に問い合わせてください。');

    expect(validateUserAccountActiveStatus).toHaveBeenCalledTimes(2);
    expect(validateUserHasReporterRole).not.toHaveBeenCalled();
  });
});
