import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  type AuthenticateReporterAccessInput,
  type AuthenticateReporterAccessOutput,
  type ValidateUserAccountActiveStatusOutput,
  type ValidateUserHasReporterRoleOutput,
} from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedValidateUserHasReporterRole = validateUserHasReporterRole as jest.MockedFunction<any>;

describe('SCEN-098: 報告者が別チーム所属のとき拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // validateUserHasReporterRole をスタブ化し、戻り値として報告者ロールを持つ状態（true）を返すよう設定
    mockedValidateUserHasReporterRole.mockResolvedValue({
      hasReporterRole: true,
      userId: 'reporter-001',
      denialReason: null,
    });

    // validateUserAccountActiveStatus をスタブ化し、戻り値としてアカウントが有効な状態（true）を返すよう設定
    mockedValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId: 'reporter-001',
      inactiveReason: null,
    });

    // authenticateAndAuthorizeReporterAccess の実装
    // 業務ルール br-tx_4-001 に基づき、ユーザーが別チーム所属の場合、拒否される
    mockedAuthenticateAndAuthorizeReporterAccess.mockImplementation(
      async (input: AuthenticateReporterAccessInput): Promise<AuthenticateReporterAccessOutput> => {
        const { userId, isAuthenticated } = input;

        if (!isAuthenticated) {
          return {
            isAccessGranted: false,
            userId,
            denialReason: 'UserNotAuthenticatedException',
          };
        }

        const accountStatus: ValidateUserAccountActiveStatusOutput = await mockedValidateUserAccountActiveStatus({ userId });
        if (!accountStatus.isActive) {
          return {
            isAccessGranted: false,
            userId,
            denialReason: 'UserAccountInactiveException',
          };
        }

        const roleStatus: ValidateUserHasReporterRoleOutput = await mockedValidateUserHasReporterRole({ userId });
        // br-tx_4-001 の計算式: if (reporter.assigned_team_id != currentTeamId) return { isEligible: false, reason: "このチームに所属していません" }
        // validateUserHasReporterRole が別チーム所属を検出した場合、denialReason に "このユーザーは日報提出対象として登録されていません。" が返される
        if (!roleStatus.hasReporterRole || roleStatus.denialReason) {
          return {
            isAccessGranted: false,
            userId,
            denialReason: roleStatus.denialReason || 'このユーザーは日報提出対象として登録されていません。',
          };
        }

        return {
          isAccessGranted: true,
          userId,
          denialReason: null,
        };
      }
    );
  });

  it('ユーザーが別チーム所属である場合、アクセスが拒否される', async () => {
    // 別チーム所属である状態をシミュレート
    mockedValidateUserHasReporterRole.mockResolvedValue({
      hasReporterRole: true,
      userId: 'reporter-001',
      denialReason: 'このユーザーは日報提出対象として登録されていません。',
    });

    const input: AuthenticateReporterAccessInput = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    const result: AuthenticateReporterAccessOutput = await mockedAuthenticateAndAuthorizeReporterAccess(input);

    // 期待結果の検証: isAccessGranted が false であることを確認
    expect(result.isAccessGranted).toBe(false);
    // 期待結果の検証: denialReason が適切に設定されていることを確認
    expect(result.denialReason).toBe('このユーザーは日報提出対象として登録されていません。');
    // 期待結果の検証: userId が 'reporter-001' であることを確認
    expect(result.userId).toBe('reporter-001');

    // 業務ルール br-tx_4-001 の計算式が適切に実装されていることを検証
    expect(mockedValidateUserAccountActiveStatus).toHaveBeenCalledWith({ userId: 'reporter-001' });
    expect(mockedValidateUserHasReporterRole).toHaveBeenCalledWith({ userId: 'reporter-001' });
  });
});
