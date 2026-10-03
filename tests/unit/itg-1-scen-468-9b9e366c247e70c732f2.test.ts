import { deactivateReporterInMaster, InvalidLeaderUserIdError } from '../../src/logic/user-master-persistence';

describe('SCEN-468: チームリーダーのユーザーIDが空文字列のため操作が拒否される', () => {
  it('should throw InvalidLeaderUserIdError when leaderUserId is empty string', async () => {
    const input = {
      reporterId: 'valid-reporter-id',
      leaderUserId: '',
      deactivationTimestamp: new Date(),
      deactivationReason: '異動',
    };

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(InvalidLeaderUserIdError);
    await expect(deactivateReporterInMaster(input)).rejects.toThrow(
      'チームリーダーのユーザーIDが指定されていません。'
    );
  });
});
