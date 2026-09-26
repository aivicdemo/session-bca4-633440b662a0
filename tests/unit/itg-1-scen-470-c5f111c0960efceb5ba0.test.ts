import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, persistReporterMasterChangeHistory, PersistenceFailureError } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-470: 報告者マスタの更新がデータベース障害で失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error response when database update fails', async () => {
    const mockPersistChangeHistory = persistReporterMasterChangeHistory as jest.Mock<any>;
    mockPersistChangeHistory.mockRejectedValueOnce(new PersistenceFailureError('DB error'));

    const input = {
      reporterId: 'reporter-123',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    const result = await deactivateReporterInMaster(input);

    expect((result as any).success).toBe(false);
    expect((result as any).reporterId).toBe(null);
    expect((result as any).message).toBe('報告者の無効化処理中にシステムエラーが発生しました。');
  });
});
