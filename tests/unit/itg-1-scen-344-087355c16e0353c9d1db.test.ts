jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, RegisterReporterInput, RegisterReporterOutput } from '../../src/logic/reporter-master-management';

describe('SCEN-344: メンバーの変更内容が不明確な場合', () => {
  it('br-tx_7-002の制約1により「変更内容を確認してください」警告が返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'user-001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
      memberChangeType: '不明',
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toContain('変更内容を確認してください');
    expect(result.changeHistoryId).toBeNull();
  });
});
