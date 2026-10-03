import { deactivateReporterInMaster, ReporterAlreadyInactiveError } from '../../src/logic/user-master-persistence';

describe('SCEN-467: 指定された報告者が既に無効化されているため操作が拒否される', () => {
  it('should throw ReporterAlreadyInactiveError when reporter is already inactive', async () => {
    const input = {
      reporterId: 'R001',
      leaderUserId: 'L001',
      deactivationTimestamp: new Date(),
      deactivationReason: '異動',
    };

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(ReporterAlreadyInactiveError);
    await expect(deactivateReporterInMaster(input)).rejects.toThrow(
      '既に無効化されています。'
    );
  });
});
