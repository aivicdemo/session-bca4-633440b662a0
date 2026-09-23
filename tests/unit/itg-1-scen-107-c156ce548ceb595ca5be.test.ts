import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  UserAccountInactiveError,
} from '../../src/logic/user-authentication-authorization';

const validateUserAccountActiveStatusMock = jest.fn();
const validateUserHasLeaderRoleMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => {
  const actual = jest.requireActual('../../src/logic/user-authentication-authorization');
  return {
    ...actual,
    validateUserAccountActiveStatus: validateUserAccountActiveStatusMock,
    validateUserHasLeaderRole: validateUserHasLeaderRoleMock,
  };
});

describe('SCEN-107: ユーザーアカウントが無効化されている場合、UserAccountInactiveError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーアカウントが無効化されているとき UserAccountInactiveError がスローされる', async () => {
    validateUserAccountActiveStatusMock.mockResolvedValue({ isActive: false });
    validateUserHasLeaderRoleMock.mockResolvedValue({ hasRole: true });

    const userId = 'leader-001';
    const isAuthenticated = true;

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow(UserAccountInactiveError);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow('ユーザーアカウントが無効です。');
  });
});
