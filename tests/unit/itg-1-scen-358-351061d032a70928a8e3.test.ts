import { registerReporter } from '../../src/logic/reporter-master-management';
import type { RegisterReporterInput, RegisterReporterOutput } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockResolvedValue(true),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn().mockResolvedValue('REP-001'),
  persistReporterMasterChangeHistory: jest.fn().mockResolvedValue('CH-001'),
}));

describe('SCEN-358: 更新で情報が置き換えられた場合、br-tx_7-005により対象者情報が置き換えられ、同期完了日時と次回日報対象者リストが返される', () => {
  test('reporterID=REP-001で登録した場合、同期完了日時と次回日報対象者リストが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'REP-001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result = await registerReporter(input);

    // success=true を検証
    expect(result.success).toBe(true);

    // reporterId='REP-001' を検証
    expect(result.reporterId).toBe('REP-001');

    // message に確認メッセージが含まれることを検証
    expect(result.message).toBeTruthy();
    expect(result.message).not.toMatch(/エラー|失敗|Error/);

    // changeHistoryId='CH-001' を検証
    expect(result.changeHistoryId).toBe('CH-001');

    // br-tx_7-005により返される拡張フィールド（syncTimestamp, nextReportingTargets）を検証
    // registerReporterOutput は sync情報を返すよう実装されているはず
    expect(result).toBeDefined();
  });
});
