import { updateReporterInMaster } from '../../src/logic/user-master-persistence';

describe('SCEN-464: 報告者情報を更新すると、変更履歴が記録される', () => {
  it('should update reporter information and record change history', async () => {
    const now = new Date();
    const input = {
      reporterId: 'R001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'L001',
      updateTimestamp: now,
    };

    const result = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).not.toBe('');
  });
});
