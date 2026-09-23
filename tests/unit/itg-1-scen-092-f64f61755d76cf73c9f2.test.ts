import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  UserNotRegisteredAsReporterException,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-092: 報告者IDが空または不正な形式のときUserNotRegisteredAsReporterExceptionが発生する', () => {
  it('パターン1: userIdが空文字列のとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '',
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

  it('パターン2: userIdがnull相当のとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: null as any,
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

  it('パターン3: userIdが不正な形式（特殊文字のみ）のとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '!@#$%',
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

  it('パターン3: userIdが不正な形式（数字以外の記号）のとき例外が発生する', async () => {
    const input: AuthenticateReporterAccessInput = {
      userId: '###',
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
