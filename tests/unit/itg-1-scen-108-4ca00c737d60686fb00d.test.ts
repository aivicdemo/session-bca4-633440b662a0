jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn(),
  validateUserHasLeaderRole: jest.fn(),
}));

import {
  authenticateAndAuthorizeLeaderAccess,
  validateUserAccountActiveStatus,
  validateUserHasLeaderRole,
  InsufficientPermissionError,
  type AuthenticateLeaderAccessInput,
} from '../../src/logic/user-authentication-authorization';

const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedValidateUserHasLeaderRole = validateUserHasLeaderRole as jest.Mock;

describe('SCEN-108: ログイン済みだがリーダー権限を持たないユーザーがアクセスを試みると、InsufficientPermissionError が発生する', () => {
  const userId = 'user-002';
  const isAuthenticated = true;

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isAccountActive: true,
      userId,
    });

    mockedValidateUserHasLeaderRole.mockResolvedValue({
      hasLeaderRole: false,
    });
  });

  it('InsufficientPermissionError が発生し、エラー文言が「管理画面へのアクセス権限がありません。」である', async () => {
    const input: AuthenticateLeaderAccessInput = {
      userId,
      isAuthenticated,
    };

    try {
      await authenticateAndAuthorizeLeaderAccess(input);
      fail('InsufficientPermissionError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InsufficientPermissionError);
      expect((error as Error).message).toBe('管理画面へのアクセス権限がありません。');
    }
  });
});
