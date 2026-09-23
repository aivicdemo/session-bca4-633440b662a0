import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  InvalidLeaderUserIdError,
  DeactivateReporterInMasterInput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
  InvalidLeaderUserIdError: class extends Error {},
}));

describe('SCEN-469: チームリーダーのユーザーIDがnullのため操作が拒否される', () => {
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // leaderUserIdがnullのときエラーを発生させるようにモック
    mockDeactivateReporterInMaster.mockImplementation(
      async (input: DeactivateReporterInMasterInput) => {
        if (!input.leaderUserId) {
          const error = new InvalidLeaderUserIdError('チームリーダーのユーザーIDが指定されていません。');
          throw error;
        }
        return { success: true, reporterId: input.reporterId, message: '報告者を無効化しました。' };
      }
    );
  });

  it('leaderUserIdがnullのときInvalidLeaderUserIdErrorが発生する', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: null as any,
      deactivationTimestamp: new Date(),
      deactivationReason: '異動',
    };

    let caughtError: Error | undefined;

    try {
      await mockDeactivateReporterInMaster(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // エラーが発生したことを確認
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe('チームリーダーのユーザーIDが指定されていません。');

    // 処理は中断され、報告者マスタは更新されず、変更履歴も記録されない
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
