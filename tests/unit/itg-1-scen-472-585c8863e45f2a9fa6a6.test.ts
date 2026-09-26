import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-472: 無効化理由が指定されない場合でも報告者が正常に無効化される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deactivate reporter successfully even when deactivationReason is null', async () => {
    const mockPersistChangeHistory = persistReporterMasterChangeHistory as jest.Mock<any>;
    mockPersistChangeHistory.mockResolvedValueOnce({
      success: true,
      changeHistoryId: 'history-456',
      message: '変更履歴が記録されました。',
    });

    const input = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date(),
    };

    const result = await deactivateReporterInMaster(input);

    expect((result as any).success).toBe(true);
    expect((result as any).reporterId).toBe('reporter-001');
    expect((result as any).message).toContain('無効化');

    expect(mockPersistChangeHistory).toHaveBeenCalledTimes(1);
  });
});
