import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-364: メールアドレスの重複が検出された場合、br-tx_7-005制約3により「このメールアドレスは既に登録されています」エラーが返される', () => {
  it('重複したメールアドレスで登録失敗エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '新規報告者',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(result.message).toContain(
      'このメールアドレスは既に登録されています'
    );
  });
});
