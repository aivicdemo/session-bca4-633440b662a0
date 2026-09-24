import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
  type AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-092: 報告者IDが空または不正な形式のときUserNotRegisteredAsReporterExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotRegisteredAsReporterException when userId is empty string', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '',
      isAuthenticated: true,
    };

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockImplementation(() => {
      throw new UserNotRegisteredAsReporterException(
        'このユーザーは日報提出対象として登録されていません。'
      );
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserNotRegisteredAsReporterException
    );

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'このユーザーは日報提出対象として登録されていません。'
    );
  });

  it('should throw UserNotRegisteredAsReporterException when userId is null-like value', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: null as any,
      isAuthenticated: true,
    };

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockImplementation(() => {
      throw new UserNotRegisteredAsReporterException(
        'このユーザーは日報提出対象として登録されていません。'
      );
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserNotRegisteredAsReporterException
    );
  });

  it('should throw UserNotRegisteredAsReporterException when userId is invalid format', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '!@#$%',
      isAuthenticated: true,
    };

    jest.mocked(authenticateAndAuthorizeReporterAccess).mockImplementation(() => {
      throw new UserNotRegisteredAsReporterException(
        'このユーザーは日報提出対象として登録されていません。'
      );
    });

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      UserNotRegisteredAsReporterException
    );

    await expect(authenticateAndAuthorizeReporterAccess(input)).rejects.toThrow(
      'このユーザーは日報提出対象として登録されていません。'
    );
  });
});
