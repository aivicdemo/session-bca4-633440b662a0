import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserAccountInactiveException,
  AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-104: チームメンバーマスタで無効化されたユーザーはアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーアカウントが無効化されている場合、アクセスが拒否される', async () => {
    const userId = 'user-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: false,
      userId,
    } as any);

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    const result = await authenticateAndAuthorizeReporterAccess({
      userId,
      isAuthenticated,
    });

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe(userId);
    expect(['account_inactive', 'UserAccountInactiveException']).toContain(result.denialReason || '');
  });

  it('validateUserAccountActiveStatus が1回だけ呼び出される', async () => {
    const userId = 'user-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: false,
      userId,
    } as any);

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    await authenticateAndAuthorizeReporterAccess({
      userId,
      isAuthenticated,
    });

    expect(validateUserAccountActiveStatus).toHaveBeenCalledTimes(1);
  });

  it('validateUserHasReporterRole が呼び出されない（無効化ユーザーであればロール検証は不要）', async () => {
    const userId = 'user-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: false,
      userId,
    } as any);

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    await authenticateAndAuthorizeReporterAccess({
      userId,
      isAuthenticated,
    });

    expect(validateUserHasReporterRole).not.toHaveBeenCalled();
  });

  it('UserAccountInactiveException がスロー', async () => {
    const userId = 'user-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: false,
      userId,
    } as any);

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: true,
      userId,
    } as any);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated,
      })
    ).rejects.toThrow(UserAccountInactiveException);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated,
      })
    ).rejects.toThrow('このアカウントは無効化されています。管理者に問い合わせてください。');
  });
});
