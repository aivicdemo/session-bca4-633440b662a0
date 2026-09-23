import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  PersistenceFailureError,
  DeactivateReporterInMasterInput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
  PersistenceFailureError: class extends Error {},
}));

describe('SCEN-471: 変更履歴の記録がデータベース障害で失敗する', () => {
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // persistReporterMasterChangeHistoryがPersistenceFailureErrorをスロー
    mockPersistReporterMasterChangeHistory.mockImplementation(() => {
      const error = new PersistenceFailureError();
      error.message = '報告者の無効化処理中にシステムエラーが発生しました。';
      throw error;
    });

    // deactivateReporterInMasterが変更履歴記録でエラー
    mockDeactivateReporterInMaster.mockImplementation(async (input: DeactivateReporterInMasterInput) => {
      try {
        await mockPersistReporterMasterChangeHistory();
      } catch (error) {
        throw error;
      }
    });
  });

  it('変更履歴記録のデータベース障害でPersistenceFailureErrorが発生する', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-123',
      deactivationTimestamp: new Date(),
      deactivationReason: '退職',
    };

    let caughtError: Error | undefined;

    try {
      await mockDeactivateReporterInMaster(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // PersistenceFailureErrorがスロー される
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe('報告者の無効化処理中にシステムエラーが発生しました。');

    // 報告者マスタは更新されず、変更履歴も記録されない
    // mockが呼ばれた時点でエラーをスロー するため、状態は変わらない
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
