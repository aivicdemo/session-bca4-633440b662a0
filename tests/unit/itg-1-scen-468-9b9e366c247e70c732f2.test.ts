import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, persistReporterMasterChangeHistory, InvalidLeaderUserIdError } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-468: チームリーダーのユーザーIDが空文字列のため操作が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when leaderUserId is empty string', async () => {
    const input = {
      reporterId: 'valid-reporter-id',
      leaderUserId: '',
      deactivationTimestamp: new Date(),
      deactivationReason: '異動',
    };

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(InvalidLeaderUserIdError);
    await expect(deactivateReporterInMaster(input)).rejects.toThrow('チームリーダーのユーザーIDが指定されていません。');

    const mockPersist = persistReporterMasterChangeHistory as jest.Mock;
    expect(mockPersist).not.toHaveBeenCalled();
  });
});
