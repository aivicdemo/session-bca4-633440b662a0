import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn(),
  validateUserHasReporterRole: jest.fn(),
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
} from '../../src/logic/user-authentication-authorization';

const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedValidateUserHasReporterRole = validateUserHasReporterRole as jest.MockedFunction<any>;
const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;

describe('SCEN-095: 報告者マスタに登録済みで有効で所属チーム一致時にアクセス許可が返される', () => {
  const userId = '報告者001';
  const isAuthenticated = true;

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId,
      inactiveReason: null,
    });

    mockedValidateUserHasReporterRole.mockResolvedValue({
      hasReporterRole: true,
      userId,
      denialReason: null,
    });

    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(async (input: AuthenticateReporterAccessInput) => {
      return {
        isAccessGranted: true,
        userId: input.userId,
        denialReason: null,
      } as AuthenticateReporterAccessOutput;
    });
  });

  it('報告者001が有効で日報入力権限を持つ場合、アクセスが許可される', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId,
      isAuthenticated,
    };

    const result: AuthenticateReporterAccessOutput = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe(userId);
    expect(result.denialReason).toBeNull();
  });
});
