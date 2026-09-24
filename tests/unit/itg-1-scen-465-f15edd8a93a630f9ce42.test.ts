import { jest } from '@jest/globals';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
  DeactivateReporterInMasterInput,
  DeactivateReporterInMasterOutput,
} from '../../src/logic/user-master-persistence';

describe('SCEN-465: チームリーダーが存在する報告者を無効化し、変更履歴が記録されて成功する', () => {
  it('should successfully deactivate reporter and record change history', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'RPT-001',
      leaderUserId: 'LEADER-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '退職',
    };

    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValueOnce({
      success: true,
      message: '変更履歴を記録しました。',
    });

    const result: DeactivateReporterInMasterOutput =
      await deactivateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toBe('報告者を無効化しました。');

    expect(persistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'RPT-001',
        leaderUserId: 'LEADER-001',
        deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
        deactivationReason: '退職',
      })
    );
    expect(persistReporterMasterChangeHistory).toHaveBeenCalledTimes(1);
  });
});
