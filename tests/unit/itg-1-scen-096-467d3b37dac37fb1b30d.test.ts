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

describe('SCEN-096: 報告者マスタに未登録のとき拒否される', () => {
  const userId = 'reporter-001';
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
        isAccessGranted: false,
        userId: input.userId,
        denialReason: 'このユーザーは日報提出対象として登録されていません。',
      } as AuthenticateReporterAccessOutput;
    });
  });

  it('ユーザーが報告者マスタに未登録の場合、アクセスが拒否される', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId,
      isAuthenticated,
    };

    const result: AuthenticateReporterAccessOutput = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe(userId);
    expect(result.denialReason).toBe('このユーザーは日報提出対象として登録されていません。');
  });
});
