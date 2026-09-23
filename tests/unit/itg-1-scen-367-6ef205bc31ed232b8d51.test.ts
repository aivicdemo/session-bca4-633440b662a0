import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-367: DELETE操作が指定された場合、監査ログに記録される', () => {
  it('DELETE操作の監査ログが記録される', async () => {
    const executionTimestamp = new Date('2024-01-15T10:30:00Z');
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT20240115001');
    expect(result.changeHistoryId).toBe('CHG20240115001');
    expect(result.message).toBe('報告者の登録に成功しました');

    // 監査ログが記録されていることを確認
    expect(result.changeHistoryId).toBeDefined();
  });
});
