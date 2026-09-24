import {
  deactivateReporterInMaster,
  InvalidLeaderUserIdError,
  type DeactivateReporterInMasterInput,
} from '../../src/logic/user-master-persistence';

describe('SCEN-469: チームリーダーのユーザーIDがnullのため操作が拒否される', () => {
  it('leaderUserIdがnullの場合、InvalidLeaderUserIdErrorをスロー', () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: null,
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    expect(() => deactivateReporterInMaster(input)).toThrow(InvalidLeaderUserIdError);
  });

  it('エラー文言が「チームリーダーのユーザーIDが指定されていません。」である', () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: null,
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    let caughtError: InvalidLeaderUserIdError | undefined;

    try {
      deactivateReporterInMaster(input);
    } catch (error) {
      if (error instanceof InvalidLeaderUserIdError) {
        caughtError = error;
      }
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe('チームリーダーのユーザーIDが指定されていません。');
  });
});
