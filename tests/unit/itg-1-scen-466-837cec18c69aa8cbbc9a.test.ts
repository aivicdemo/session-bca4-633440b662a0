import { deactivateReporterInMaster, ReporterNotFoundError } from '../../src/logic/user-master-persistence';

describe('SCEN-466: 指定された報告者IDがマスタに存在しないため無効化が失敗する', () => {
  it('should throw ReporterNotFoundError when reporter does not exist', async () => {
    const input = {
      reporterId: 'non-existent-reporter-999',
      leaderUserId: 'L001',
      deactivationTimestamp: new Date(),
      deactivationReason: 'テスト用理由',
    };

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(ReporterNotFoundError);
    await expect(deactivateReporterInMaster(input)).rejects.toThrow(
      '指定された報告者が見つかりません。'
    );
  });
});
