import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-368: 報告者IDが空または不正な形式の場合、br-tx_7-007制約1により「報告者IDが指定されていません」エラーが返される', () => {
  it('報告者IDが空の場合、エラーメッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: '',
      reporterName: 'テスト太郎',
      emailAddress: 'test@example.com',
      teamLeaderId: 'leader_001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.message).toBe('報告者IDが指定されていません');
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
  });
});
