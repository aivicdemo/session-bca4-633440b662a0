import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  AuthenticateReporterAccessInput,
} from '../../src/logic/user-authentication-authorization';

const validateUserAccountActiveStatusMock = jest.fn();

jest.mock('../../src/logic/user-authentication-authorization', () => {
  const actual = jest.requireActual('../../src/logic/user-authentication-authorization');
  return {
    ...actual,
    validateUserAccountActiveStatus: validateUserAccountActiveStatusMock,
  };
});

describe('SCEN-101: ユーザーマスタへのデータベースアクセスが失敗したとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベースアクセス失敗時に例外が発生する', async () => {
    validateUserAccountActiveStatusMock.mockRejectedValue(
      new Error('システムエラーが発生しました。管理者に連絡してください')
    );

    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    await expect(
      authenticateAndAuthorizeReporterAccess(input)
    ).rejects.toThrow();

    try {
      await authenticateAndAuthorizeReporterAccess(input);
    } catch (error) {
      expect((error as Error).message).toContain('システムエラーが発生しました。管理者に連絡してください');
    }
  });
});
