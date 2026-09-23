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

describe('SCEN-095: 報告者マスタに登録済みで有効で所属チーム一致時にアクセス許可が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効なユーザーでアクセスが許可される', async () => {
    validateUserAccountActiveStatusMock.mockResolvedValue({ isActive: true });
    validateUserHasReporterRoleMock.mockResolvedValue({ hasRole: true });

    const input: AuthenticateReporterAccessInput = {
      userId: '報告者001',
      isAuthenticated: true,
    };

    const result: AuthenticateReporterAccessOutput = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('報告者001');
    expect(result.denialReason).toBeNull();
  });
});
