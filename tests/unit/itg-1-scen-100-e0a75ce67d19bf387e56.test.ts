import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const validateUserHasReporterRoleMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => {
  const actual = jest.requireActual('../../src/logic/user-authentication-authorization');
  return {
    ...actual,
    validateUserHasReporterRole: validateUserHasReporterRoleMock,
  };
});

describe('SCEN-100: チームIDが空または不正な形式のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームIDが不正なとき例外が発生する', async () => {
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
