import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const validateUserAccountActiveStatusMock = jest.fn();
const validateUserHasReporterRoleMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => {
  const actual = jest.requireActual('../../src/logic/user-authentication-authorization');
  return {
    ...actual,
    validateUserAccountActiveStatus: validateUserAccountActiveStatusMock,
    validateUserHasReporterRole: validateUserHasReporterRoleMock,
  };
});

describe('SCEN-103: チームメンバーマスタに未登録のユーザーはアクセスが拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームメンバーマスタに未登録のユーザーはアクセスが拒否される', async () => {
    validateUserAccountActiveStatusMock.mockResolvedValue({ isActive: false });
    validateUserHasReporterRoleMock.mockResolvedValue({ hasRole: false });

    const input: AuthenticateReporterAccessInput = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow(UserNotRegisteredAsReporterException);

    try {
      await authenticateAndAuthorizeReporterAccess(input);
    } catch (error) {
      expect((error as Error).message).toBe('このユーザーは日報提出対象として登録されていません。');
    }
  });
});
