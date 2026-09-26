import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, persistReporterMasterChangeHistory, ReporterAlreadyInactiveError } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-467: 指定された報告者が既に無効化されているため操作が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject deactivation when reporter is already inactive', async () => {
    const input = {
      reporterId: 'R001',
      leaderUserId: 'L001',
      deactivationTimestamp: new Date(),
      deactivationReason: '異動',
    };

    await expect(deactivateReporterInMaster(input)).rejects.toThrow(ReporterAlreadyInactiveError);
    await expect(deactivateReporterInMaster(input)).rejects.toThrow('この報告者は既に無効化されています。');

    // persistReporterMasterChangeHistory should not be called
    const mockPersist = persistReporterMasterChangeHistory as jest.Mock;
    expect(mockPersist).not.toHaveBeenCalled();
  });
});
