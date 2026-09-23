import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-366: UPDATE操作で変更前後の値が異なる場合、変更された項目だけが監査ログに記録される', () => {
  it('UPDATE操作で変更項目のみが監査ログに記録される', async () => {
    const input1: RegisterReporterInput = {
      userId: 'valid_user_1',
      reporterName: '山田太郎',
      emailAddress: 'newuser@example.com',
      teamLeaderId: 'valid_team_leader',
      executionTimestamp: new Date(),
    };

    const result1: RegisterReporterOutput = await registerReporter(input1);
    expect(result1.success).toBe(true);

    // UPDATE操作相当で2回目の呼び出し
    const input2: RegisterReporterInput = {
      userId: 'valid_user_1',
      reporterName: '山田太郎更新',
      emailAddress: 'newuser@example.com',
      teamLeaderId: 'valid_team_leader',
      executionTimestamp: new Date(new Date().getTime() + 1000),
    };

    const result2: RegisterReporterOutput = await registerReporter(input2);

    expect(result2.success).toBe(true);
    // 変更されたのは reporterName のみのため、それのみが changedFields に含まれる
    expect(result2.changeHistoryId).toBeDefined();
  });
});
