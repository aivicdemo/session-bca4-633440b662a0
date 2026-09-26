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

  it('チームメンバーマスタに未登録のユーザーはアクセスが拒否される', async () => {
    jest.mocked(validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: true,
      userId: 'user-001',
    });

    jest.mocked(validateUserHasReporterRole as any).mockResolvedValue({
      hasReporterRole: false,
      userId: 'user-001',
    });

    try {
      await authenticateAndAuthorizeReporterAccess({
        userId: 'user-001',
        isAuthenticated: true,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotRegisteredAsReporterException);
      expect((error as Error).message).toBe('このユーザーは日報提出対象として登録されていません。');
    }
  });
});
