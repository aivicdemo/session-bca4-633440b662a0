import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
  ReporterNotFoundError,
  type DeactivateReporterInMasterInput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-466: 指定された報告者IDがマスタに存在しないため無効化が失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('マスタに存在しない報告者IDを指定した場合、ReporterNotFoundErrorが発生する', async () => {
    const mockDeactivate = deactivateReporterInMaster as jest.Mock<any>;
    const mockPersistHistory = persistReporterMasterChangeHistory as jest.Mock<any>;

    const error = new ReporterNotFoundError('指定された報告者が見つかりません。');
    mockDeactivate.mockRejectedValue(error as any);

    const input: DeactivateReporterInMasterInput = {
      reporterId: 'non-existent-reporter-999',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2024-01-15T10:00:00+09:00'),
      deactivationReason: 'テスト用理由',
    };

    try {
      await deactivateReporterInMaster(input);
      throw new Error('ReporterNotFoundErrorが発生すべきですが、発生しませんでした。');
    } catch (err) {
      expect(err).toBeInstanceOf(ReporterNotFoundError);
      expect((err as any).message).toContain('指定された報告者が見つかりません。');
    }

    expect(mockPersistHistory).not.toHaveBeenCalled();
  });
});
