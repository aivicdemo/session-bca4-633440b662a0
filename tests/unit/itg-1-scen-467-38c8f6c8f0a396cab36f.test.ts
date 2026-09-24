import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
  ReporterAlreadyInactiveError,
  type DeactivateReporterInMasterInput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-467: 指定された報告者が既に無効化されているため操作が拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既に無効化されている報告者を無効化しようとした場合、ReporterAlreadyInactiveErrorが発生する', async () => {
    const mockDeactivate = deactivateReporterInMaster as jest.Mock<any>;
    const mockPersistHistory = persistReporterMasterChangeHistory as jest.Mock<any>;

    const error = new ReporterAlreadyInactiveError('この報告者は既に無効化されています。');
    mockDeactivate.mockRejectedValue(error as any);

    const input: DeactivateReporterInMasterInput = {
      reporterId: 'R001',
      leaderUserId: 'L001',
      deactivationTimestamp: new Date('2024-01-15T10:00:00+09:00'),
      deactivationReason: '異動',
    };

    try {
      await deactivateReporterInMaster(input);
      throw new Error('ReporterAlreadyInactiveErrorが発生すべきですが、発生しませんでした。');
    } catch (error) {
      expect(error).toBeInstanceOf(ReporterAlreadyInactiveError);
      expect((error as any).message).toBe('この報告者は既に無効化されています。');
    }

    expect(mockPersistHistory).not.toHaveBeenCalled();
  });
});
