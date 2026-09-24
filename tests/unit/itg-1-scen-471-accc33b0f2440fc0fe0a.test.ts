import { jest } from '@jest/globals';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
  DeactivateReporterInMasterInput,
  DeactivateReporterInMasterOutput,
  PersistenceFailureError,
} from '../../src/logic/user-master-persistence';

describe('SCEN-471: 変更履歴の記録がデータベース障害で失敗する', () => {
  it('should throw PersistenceFailureError with correct message when persistReporterMasterChangeHistory fails', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-123',
      deactivationTimestamp: new Date(),
      deactivationReason: '退職',
    };

    jest.mocked(persistReporterMasterChangeHistory).mockRejectedValueOnce(
      new PersistenceFailureError('Database connection failed')
    );

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(
      PersistenceFailureError
    );

    await expect(deactivateReporterInMaster(input)).rejects.toMatchObject({
      message: '報告者の無効化処理中にシステムエラーが発生しました。',
    });
  });
});
