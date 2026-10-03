import { deactivateReporterInMaster, PersistenceFailureError } from '../../src/logic/user-master-persistence';

describe('SCEN-470: 報告者マスタの更新がデータベース障害で失敗する', () => {
  it('should handle database failure during deactivation', async () => {
    const input = {
      reporterId: 'reporter-123',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    try {
      const result = await deactivateReporterInMaster(input);
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toBe('報告者の無効化処理中にシステムエラーが発生しました。');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceFailureError);
    }
  });
});
