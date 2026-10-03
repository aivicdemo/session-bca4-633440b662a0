import { describe, it, expect } from '@jest/globals';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';

describe('SCEN-472: 無効化理由が指定されない場合でも報告者が正常に無効化される', () => {
  it('should successfully deactivate reporter when deactivationReason is not specified', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date(),
    };

    const result = await deactivateReporterInMaster(input);

    expect((result as any).success).toBe(true);
  });
});
