import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deactivateReporterInMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-465: チームリーダーが存在する報告者を無効化し、変更履歴が記録されて成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deactivate reporter successfully with change history recorded', async () => {
    const mockPersistChangeHistory = persistReporterMasterChangeHistory as jest.Mock<any>;
    mockPersistChangeHistory.mockResolvedValueOnce({
      success: true,
      changeHistoryId: 'history-123',
      message: '変更履歴が記録されました。',
    });

    const input = {
      reporterId: 'RPT-001',
      leaderUserId: 'LEADER-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '退職',
    };

    const result = await deactivateReporterInMaster(input);

    // Output validation
    expect((result as any).success).toBe(true);
    expect((result as any).reporterId).toBe('RPT-001');
    expect((result as any).message).toBe('報告者を無効化しました。');

    // Verify persistReporterMasterChangeHistory was called exactly once
    expect(mockPersistChangeHistory).toHaveBeenCalledTimes(1);

    // Verify the arguments passed to persistReporterMasterChangeHistory
    const callArgs = mockPersistChangeHistory.mock.calls[0][0];
    expect((callArgs as any).reporterId).toBe('RPT-001');
    expect((callArgs as any).leaderUserId).toBe('LEADER-001');
    expect((callArgs as any).operationTimestamp).toEqual(new Date('2025-01-15T10:30:00Z'));
    expect((callArgs as any).changeReason).toBe('退職');
  });
});
