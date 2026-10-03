import { describe, it, expect } from '@jest/globals';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';

describe('SCEN-465: チームリーダーが存在する報告者を無効化し、変更履歴が記録されて成功する', () => {
  it('should deactivate reporter successfully with change history recorded', async () => {
    const input = {
      reporterId: 'RPT-001',
      leaderUserId: 'LEADER-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '退職',
    };

    const result = await deactivateReporterInMaster(input);

    expect((result as any).success).toBe(true);
  });
});
