import {
  registerReporter,
  RegisterReporterInput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-359: 削除で対象者が指定された場合、br-tx_7-005により対象者リストから除外される', () => {
  it('削除対象者を除外した対象者リストが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'user_active_1',
      reporterName: 'テスト太郎',
      emailAddress: 'test.taro@example.com',
      teamLeaderId: 'leader_001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter_new_001');
    expect(result.changeHistoryId).toBe('history_001');
    expect(result.syncTimestamp).toBeDefined();

    // 削除対象の報告者がaffectedReportersに含まれないことを確認
    expect(result.affectedReporters).toBeDefined();
    expect(result.affectedReporters).not.toContain('reporter_to_delete');

    // nextReportingTargetsが削除対象を除いた3名のみを含むことを確認
    expect(result.nextReportingTargets).toBeDefined();
    expect(result.nextReportingTargets.length).toBe(3);
    expect(result.nextReportingTargets).toContain('user_active_1');
    expect(result.nextReportingTargets).toContain('user_active_2');
    expect(result.nextReportingTargets).toContain('user_active_3');
    expect(result.nextReportingTargets).not.toContain('reporter_to_delete');
  });
});
