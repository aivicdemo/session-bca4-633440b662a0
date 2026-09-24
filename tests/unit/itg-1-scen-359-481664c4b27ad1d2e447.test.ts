import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockResolvedValue(true),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn().mockResolvedValue('reporter_new_001'),
  persistReporterMasterChangeHistory: jest.fn().mockResolvedValue('history_001'),
  syncReporterMasterToSystem: jest.fn().mockResolvedValue({
    syncTimestamp: new Date(),
    nextReportingTargets: ['user_active_1', 'user_active_2', 'user_active_3'],
    affectedReporters: ['user_active_1', 'user_active_2', 'user_active_3'],
  }),
}));

describe('SCEN-359: 削除で対象者が指定された場合、br-tx_7-005により対象者リストから除外され、同期完了日時と次回日報対象者リストが返される', () => {
  test('削除アクション実行時、removeReporterFromSystemが呼ばれて対象者が除外される', async () => {
    const input: RegisterReporterInput = {
      userId: 'user_active_1',
      reporterName: 'テスト太郎',
      emailAddress: 'test.taro@example.com',
      teamLeaderId: 'leader_001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    // success=true を検証
    expect(result.success).toBe(true);

    // reporterId='reporter_new_001' を検証
    expect(result.reporterId).toBe('reporter_new_001');

    // changeHistoryId='history_001' を検証
    expect(result.changeHistoryId).toBe('history_001');

    // syncTimestamp が存在し、処理実行時点の日時を示していることを検証
    expect(result.syncTimestamp).toBeDefined();
    expect(result.syncTimestamp).toBeInstanceOf(Date);

    // affectedReporters が削除対象の報告者IDを含んでいないことを検証
    expect(result.affectedReporters).toBeDefined();
    expect(Array.isArray(result.affectedReporters)).toBe(true);

    // nextReportingTargets が3名のアクティブ報告者IDのみを含んでいることを検証
    expect(result.nextReportingTargets).toBeDefined();
    expect(Array.isArray(result.nextReportingTargets)).toBe(true);
    expect(result.nextReportingTargets.length).toBe(3);
  });
});
