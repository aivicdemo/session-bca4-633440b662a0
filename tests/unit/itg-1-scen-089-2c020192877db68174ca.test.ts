import { describe, it, expect } from '@jest/globals';
import {
  authenticateAndAuthorizeReporterAccess,
} from '../../src/logic/user-authentication-authorization';

describe('SCEN-089: アカウント有効かつ報告者ロール保有時にアクセスが許可される', () => {
  it('should grant access when account is active and user has reporter role', async () => {
    // 前提：reporter-001 ユーザーがアクティブで報告者ロールを持つ状態
    const input = {
      userId: 'reporter-001',
      isAuthenticated: true,
    };

    // authenticateAndAuthorizeReporterAccess を呼び出し
    const result = await authenticateAndAuthorizeReporterAccess(input);

    // 期待結果：アクセスが許可され、isAccessGranted=true、userId='reporter-001'、denialReason=null
    expect(result.isAccessGranted).toBe(true);
    expect(result.userId).toBe('reporter-001');
    expect(result.denialReason).toBeNull();
  });
});
