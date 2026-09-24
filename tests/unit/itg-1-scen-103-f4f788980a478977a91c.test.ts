import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  UserNotRegisteredAsReporterException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-103: チームメンバーマスタに未登録のユーザーはアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーが未登録の場合、アクセスが拒否され UserNotRegisteredAsReporterException がスローされる', async () => {
    const userId = 'user-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: true,
      userId,
    } as any);

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: false,
      userId,
    } as any);

    const result = await authenticateAndAuthorizeReporterAccess({
      userId,
      isAuthenticated,
    });

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBe('USER_NOT_REGISTERED_AS_REPORTER');
  });

  it('UserNotRegisteredAsReporterException がスロー', async () => {
    const userId = 'user-001';
    const isAuthenticated = true;

    jest.mocked(validateUserAccountActiveStatus).mockResolvedValue({
      isValid: true,
      userId,
    } as any);

    jest.mocked(validateUserHasReporterRole).mockResolvedValue({
      hasRole: false,
      userId,
    } as any);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated,
      })
    ).rejects.toThrow(UserNotRegisteredAsReporterException);

    await expect(
      authenticateAndAuthorizeReporterAccess({
        userId,
        isAuthenticated,
      })
    ).rejects.toThrow('このユーザーは日報提出対象として登録されていません。');
  });
});
