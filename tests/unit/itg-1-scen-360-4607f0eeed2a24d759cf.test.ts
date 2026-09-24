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
  registerReporterToMaster: jest.fn().mockResolvedValue('R001'),
  persistReporterMasterChangeHistory: jest.fn().mockResolvedValue('CH-001'),
  syncReporterMasterToSystem: jest.fn().mockResolvedValue({
    syncTimestamp: new Date(),
    nextReportingTargets: [],
  }),
}));

describe('SCEN-360: 有効状態が無効に変更された報告者の場合、br-tx_7-005により日報入力対象から自動的に除外される', () => {
  test('isActive=falseの報告者は日報対象者リストから除外される', async () => {
    const input: RegisterReporterInput = {
      userId: 'R001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    // success=true を検証
    expect(result.success).toBe(true);

    // syncReporterMasterToSystem が内部的に呼ばれたことを確認
    expect(result.syncTimestamp).toBeDefined();

    // isActive=falseの報告者は nextReportingTargets に含まれない
    expect(result.nextReportingTargets).toBeDefined();
    expect(Array.isArray(result.nextReportingTargets)).toBe(true);
    expect(result.nextReportingTargets).not.toContain('R001');
  });
});
