import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  AuthenticateReporterAccessInput,
  AuthenticateReporterAccessOutput,
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

describe('SCEN-102: チームメンバーマスタに登録済みでアクティブなユーザーにアクセスが許可される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('登録済みでアクティブなユーザーにアクセスが許可される', async () => {
    validateUserAccountActiveStatusMock.mockResolvedValue({ isActive: true });
    validateUserHasReporterRoleMock.mockResolvedValue({ hasRole: true });

    const input: AuthenticateReporterAccessInput = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    const result: AuthenticateReporterAccessOutput = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBeNull();
  });
});
