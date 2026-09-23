import { registerReporter } from '../../src/logic/reporter-master-management';

describe('SCEN-357: 新規登録で有効なメールアドレスと報告者情報が入力された場合', () => {
  it('should successfully register a new reporter and return success status', async () => {
    const currentTimestamp = new Date();

    const result = await registerReporter({
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: currentTimestamp,
    });

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP001');
    expect(result.message).toBe('報告者を登録しました');
    expect(result.changeHistoryId).toBe('CHG001');
  });
});
