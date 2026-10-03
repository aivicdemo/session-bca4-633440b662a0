import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-353: メールアドレスが空または形式が不正な場合、br-tx_7-004の制約1により「有効なメールアドレスを入力してください」エラーメッセージが返される', () => {
  it('emailAddressパラメータが空文字列の場合、success=false、reporterId=null、message=\"有効なメールアドレスを入力してください\"、changeHistoryId=nullが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: '',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('有効なメールアドレスを入力してください');
    expect(result.changeHistoryId).toBeNull();
  });
});
