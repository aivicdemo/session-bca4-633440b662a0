import { jest } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
  AuthenticateReporterAccessInput,
  AuthenticateReporterAccessOutput,
  ValidateUserAccountActiveStatusOutput,
  ValidateUserHasReporterRoleOutput,
  UserAccountInactiveException,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-104: チームメンバーマスタで無効化されたユーザーはアクセスが拒否される', () => {
  it('無効化されたユーザーがアクセスを試みた場合、isAccessGranted=false でアクセスが拒否される', async () => {
    // 準備：モックの設定
    const userId = 'user-inactive-12345';
    const input: AuthenticateReporterAccessInput = {
      userId,
      isAuthenticated: true,
    };

    // validateUserAccountActiveStatus をモック化：無効化状態を返す
    const mockValidateUserAccountActiveStatus = (jest.fn() as any).mockResolvedValue({
      isActive: false,
      userId,
    } as ValidateUserAccountActiveStatusOutput);

    // validateUserHasReporterRole をモック化：報告者ロール有効を返す（万が一呼び出された場合に備え）
    const mockValidateUserHasReporterRole = (jest.fn() as any).mockResolvedValue({
      hasReporterRole: true,
      userId,
    } as ValidateUserHasReporterRoleOutput);

    // モックを inject (本来は DI を使用)
    (global as any).__validateUserAccountActiveStatus = mockValidateUserAccountActiveStatus;
    (global as any).__validateUserHasReporterRole = mockValidateUserHasReporterRole;

    // テスト対象の公開処理を呼び出す
    const result = await authenticateAndAuthorizeReporterAccess(input);

    // 検証1: 戻り値の型が AuthenticateReporterAccessOutput であること
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect('isAccessGranted' in result).toBe(true);
    expect('userId' in result).toBe(true);
    expect('denialReason' in result).toBe(true);

    // 検証2: isAccessGranted が false であること
    expect(result.isAccessGranted).toBe(false);

    // 検証3: userId が入力値と一致すること
    expect(result.userId).toBe(userId);

    // 検証4: denialReason が account_inactive または UserAccountInactiveException に合致する値であること
    expect(
      result.denialReason === 'account_inactive' ||
      result.denialReason?.includes('UserAccountInactiveException') ||
      result.denialReason?.includes('無効化')
    ).toBe(true);

    // 検証5: validateUserAccountActiveStatus が1回だけ呼び出されたこと
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledTimes(1);
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledWith({ userId });

    // 検証6: validateUserHasReporterRole が呼び出されなかったこと（無効化ユーザーであればロール検証は不要）
    expect(mockValidateUserHasReporterRole).not.toHaveBeenCalled();
  });
});
