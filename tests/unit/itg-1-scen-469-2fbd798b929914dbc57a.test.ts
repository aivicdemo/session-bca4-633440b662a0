import { deactivateReporterInMaster, InvalidLeaderUserIdError } from '../../src/logic/user-master-persistence';

describe('SCEN-469: チームリーダーのユーザーIDがnullのため操作が拒否される', () => {
  it('should throw InvalidLeaderUserIdError when leaderUserId is null', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderUserId: null as any,
      deactivationTimestamp: new Date(),
      deactivationReason: '異動',
    };

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(InvalidLeaderUserIdError);
    await expect(deactivateReporterInMaster(input)).rejects.toThrow(
      'チームリーダーのユーザーIDが指定されていません。'
    );
  });
});
