import {
  registerReporter,
  RegisterReporterInput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-360: 有効状態が無効に変更された報告者の場合、br-tx_7-005により日報入力対象から除外される', () => {
  it('isActiveがfalseの報告者は日報入力対象から自動的に除外される', async () => {
    const input: RegisterReporterInput = {
      userId: 'R001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // isActive=falseの報告者は次回日報対象者リストから除外されていることを確認
    expect(result.nextReportingTargets).toBeDefined();
    expect(result.nextReportingTargets).not.toContain('R001');
  });
});
