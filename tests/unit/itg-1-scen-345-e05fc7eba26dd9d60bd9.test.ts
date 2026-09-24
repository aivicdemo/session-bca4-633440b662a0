jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, RegisterReporterInput, RegisterReporterOutput } from '../../src/logic/reporter-master-management';

describe('SCEN-345: 既に登録されているメンバーIDが重複して登録されようとする場合', () => {
  it('br-tx_7-002の制約2により「このメンバーは既に登録されています」エラーで処理が中断される', async () => {
    const input: RegisterReporterInput = {
      userId: 'user-001',
      reporterName: 'テスト太郎',
      emailAddress: 'member1.new@company.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメンバーは既に登録されています');
    expect(result.changeHistoryId).toBeNull();
  });
});
