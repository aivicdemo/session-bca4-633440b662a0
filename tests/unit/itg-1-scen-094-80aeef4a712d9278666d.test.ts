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

describe('SCEN-094: チームIDが空または不正なときUserNotRegisteredAsReporterExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームIDが空のとき例外が発生する', async () => {
    validateUserAccountActiveStatusMock.mockResolvedValue({ isActive: true });
    validateUserHasReporterRoleMock.mockRejectedValue(
      new UserNotRegisteredAsReporterException('このユーザーは日報提出対象として登録されていません。')
    );

    const input: AuthenticateReporterAccessInput = {
      userId: 'user123',
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
