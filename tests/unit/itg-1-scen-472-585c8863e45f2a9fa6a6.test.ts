import { jest } from '@jest/globals';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
  DeactivateReporterInMasterInput,
  DeactivateReporterInMasterOutput,
} from '../../src/logic/user-master-persistence';

describe('SCEN-472: 無効化理由が指定されない場合でも報告者が正常に無効化される', () => {
  it('should deactivate reporter successfully when deactivationReason is null', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date(),
      deactivationReason: null as any,
    };

    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValueOnce({
      success: true,
      message: '変更履歴を記録しました。',
    });

    const result: DeactivateReporterInMasterOutput =
      await deactivateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.message).toContain('無効化');
    expect(persistReporterMasterChangeHistory).toHaveBeenCalled();
  });

  it('should deactivate reporter successfully when deactivationReason is omitted', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date(),
    };

    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValueOnce({
      success: true,
      message: '変更履歴を記録しました。',
    });

    const result: DeactivateReporterInMasterOutput =
      await deactivateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.message).toContain('無効化');
    expect(persistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
