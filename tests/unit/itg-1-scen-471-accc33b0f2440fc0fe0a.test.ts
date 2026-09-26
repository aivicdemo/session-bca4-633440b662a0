import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, persistReporterMasterChangeHistory, PersistenceFailureError } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-471: 変更履歴の記録がデータベース障害で失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PersistenceFailureError when change history persistence fails', async () => {
    const mockPersistChangeHistory = persistReporterMasterChangeHistory as jest.Mock<any>;
    mockPersistChangeHistory.mockRejectedValueOnce(new PersistenceFailureError('変更履歴保存失敗'));

    const input = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-123',
      deactivationTimestamp: new Date(),
      deactivationReason: '退職',
    };

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(PersistenceFailureError);
    await expect(deactivateReporterInMaster(input)).rejects.toThrow('報告者の無効化処理中にシステムエラーが発生しました。');
  });
});
