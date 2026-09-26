import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, persistReporterMasterChangeHistory, InvalidLeaderUserIdError } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-469: チームリーダーのユーザーIDがnullのため操作が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when leaderUserId is null', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderUserId: null,
      deactivationTimestamp: new Date(),
      deactivationReason: '異動',
    };

    await expect(deactivateReporterInMaster(input as any)).rejects.toThrow(InvalidLeaderUserIdError);
    await expect(deactivateReporterInMaster(input as any)).rejects.toThrow('チームリーダーのユーザーIDが指定されていません。');

    const mockPersist = persistReporterMasterChangeHistory as jest.Mock;
    expect(mockPersist).not.toHaveBeenCalled();
  });
});
