import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeLeaderAccess,
  InsufficientPermissionError,
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

describe('SCEN-108: ログイン済みだがリーダー権限を持たないユーザーがアクセスを試みると、InsufficientPermissionError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダー権限を持たないとき InsufficientPermissionError がスローされる', async () => {
    validateUserAccountActiveStatusMock.mockResolvedValue({ isActive: true });
    validateUserHasLeaderRoleMock.mockResolvedValue({ hasRole: false });

    const userId = 'user-002';
    const isAuthenticated = true;

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow(InsufficientPermissionError);

    await expect(
      authenticateAndAuthorizeLeaderAccess({ userId, isAuthenticated })
    ).rejects.toThrow('管理画面へのアクセス権限がありません。');
  });
});
