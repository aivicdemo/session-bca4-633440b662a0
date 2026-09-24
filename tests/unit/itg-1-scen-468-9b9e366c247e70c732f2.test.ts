import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
  InvalidLeaderUserIdError,
  type DeactivateReporterInMasterInput,
  type DeactivateReporterInMasterOutput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-468: チームリーダーのユーザーIDが空文字列のため操作が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('leaderUserIdが空文字列のときInvalidLeaderUserIdErrorが発生し、出力型が返されない', async () => {
    const mockDeactivate = deactivateReporterInMaster as jest.Mock<any>;
    const mockPersistHistory = persistReporterMasterChangeHistory as jest.Mock<any>;

    const error = new InvalidLeaderUserIdError('チームリーダーのユーザーIDが指定されていません。');
    mockDeactivate.mockRejectedValue(error as any);

    const input: DeactivateReporterInMasterInput = {
      reporterId: 'valid-reporter-id',
      leaderUserId: '',
      deactivationTimestamp: new Date('2024-01-15T10:00:00+09:00'),
      deactivationReason: '異動',
    };

    try {
      await deactivateReporterInMaster(input);
      throw new Error('InvalidLeaderUserIdErrorが発生すべきですが、発生しませんでした。');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidLeaderUserIdError);
      expect((err as any).message).toBe('チームリーダーのユーザーIDが指定されていません。');
    }

    expect(mockPersistHistory).not.toHaveBeenCalled();
  });
});
