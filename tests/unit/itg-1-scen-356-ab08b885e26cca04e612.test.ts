import { registerReporter } from '../../src/logic/reporter-master-management';

describe('SCEN-356: 同じ報告者IDが既に別のメールアドレスで登録されている場合', () => {
  it('should return error when reporterId already exists with different email', async () => {
    const currentTimestamp = new Date();

    const result = await registerReporter({
      userId: 'USER-NEW001',
      reporterName: '重複ID報告者',
      emailAddress: 'duplicate-id@example.com',
      teamLeaderId: 'USER-TL001',
      executionTimestamp: currentTimestamp,
    });

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('この報告者IDは既に登録されています');
    expect(result.changeHistoryId).toBeNull();
  });
});
