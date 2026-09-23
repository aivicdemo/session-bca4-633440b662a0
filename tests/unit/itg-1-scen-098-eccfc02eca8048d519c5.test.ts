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

describe('SCEN-098: 報告者が別チーム所属のとき拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーが別チーム所属のとき拒否される', async () => {
    validateUserAccountActiveStatusMock.mockResolvedValue({ isActive: true });
    validateUserHasReporterRoleMock.mockResolvedValue({
      hasRole: true,
      assignedTeamId: 'team-b',
      currentTeamId: 'team-a',
    });

    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    const result: AuthenticateReporterAccessOutput = await authenticateAndAuthorizeReporterAccess(input);

    expect(result.isAccessGranted).toBe(false);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBe('このユーザーは日報提出対象として登録されていません。');
  });
});
