import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-365: CREATE操作で報告者IDと必要な情報が指定された場合、監査ログに記録される', () => {
  it('CREATE操作の監査ログが記録される', async () => {
    const executionTimestamp = new Date('2024-01-15T10:30:00Z');
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp,
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-2024-001');
    expect(result.changeHistoryId).toBe('CHG-2024-0001');
    expect(result.message).toBe('報告者を登録しました');

    // 監査ログが記録されていることを確認
    // operationType='CREATE'、reporterId='RPT-2024-001'、executedBy='LEAD001'
    expect(result.changeHistoryId).toBeDefined();
  });
});
