jest.mock('../../src/logic/user-authentication-authorization', () => {
  const actual = jest.requireActual('../../src/logic/user-authentication-authorization');
  return {
    ...actual,
    validateUserAccountActiveStatus: jest.fn(),
    validateUserHasReporterRole: jest.fn(),
  };
});

import {
  authenticateAndAuthorizeReporterAccess,
  validateUserAccountActiveStatus,
  validateUserHasReporterRole,
} from '../../src/logic/user-authentication-authorization';

const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedValidateUserHasReporterRole = validateUserHasReporterRole as jest.Mock;

describe('SCEN-102: チームメンバーマスタに登録済みでアクティブなユーザーにアクセスが許可される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('チームメンバーマスタに登録済みでアクティブなユーザーの場合、isAccessGranted=true, denialReason=null で出力される', async () => {
    // validateUserAccountActiveStatus スタブを設定: userId='user-001' に対して正常系（アカウント有効）を返す
    mockedValidateUserAccountActiveStatus.mockResolvedValueOnce({
      isActive: true,
    });

    // validateUserHasReporterRole スタブを設定: userId='user-001' に対して正常系（報告者ロール保有）を返す
    mockedValidateUserHasReporterRole.mockResolvedValueOnce({
      hasRole: true,
    });

    // authenticateAndAuthorizeReporterAccess 関数に以下の入力値を与える: userId='user-001', isAuthenticated=true
    const input = {
      userId: 'user-001',
      isAuthenticated: true,
    };

    // authenticateAndAuthorizeReporterAccess 関数を実行する
    const result = await authenticateAndAuthorizeReporterAccess(input);

    // 出力型 AuthenticateReporterAccessOutput の値が以下を満たす: isAccessGranted=true, userId='user-001', denialReason=null
    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.denialReason).toBeNull();

    // スタブが期待通りに呼び出されたことを検証
    expect(mockedValidateUserAccountActiveStatus).toHaveBeenCalledWith({ userId: 'user-001' });
    expect(mockedValidateUserHasReporterRole).toHaveBeenCalledWith({ userId: 'user-001' });
  });
});
