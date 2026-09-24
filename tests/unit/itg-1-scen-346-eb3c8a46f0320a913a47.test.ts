jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, RegisterReporterInput, RegisterReporterOutput } from '../../src/logic/reporter-master-management';

describe('SCEN-346: 削除対象のメンバーが過去7日以内に日報を提出している場合', () => {
  it('br-tx_7-002の制約3により「最近の日報があります。削除前に確認してください」警告が返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'reporter-001',
      reporterName: '削除対象メンバー名',
      emailAddress: 'delete.member@example.com',
      teamLeaderId: 'teamleader-001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('最近の日報があります。削除前に確認してください');
    expect(result.changeHistoryId).toBeNull();
  });
});
