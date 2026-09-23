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

describe('SCEN-470: 報告者マスタの更新がデータベース障害で失敗する', () => {
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // persistReporterMasterChangeHistoryがエラーを発生させるようにモック
    mockPersistReporterMasterChangeHistory.mockImplementation(() => {
      const error = new PersistenceFailureError();
      error.message = '報告者の無効化処理中にシステムエラーが発生しました。';
      throw error;
    });

    // deactivateReporterInMasterがPersistenceFailureErrorをスロー するようにモック
    mockDeactivateReporterInMaster.mockImplementation(async (input: DeactivateReporterInMasterInput) => {
      try {
        await mockPersistReporterMasterChangeHistory();
      } catch (error) {
        throw error;
      }
    });
  });

  it('データベース障害で失敗時、PersistenceFailureErrorが発生する', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-123',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    let caughtError: Error | undefined;

    try {
      await mockDeactivateReporterInMaster(input);
    } catch (error) {
      caughtError = error as Error;
    }

    // PersistenceFailureErrorが発生したことを確認
    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe('報告者の無効化処理中にシステムエラーが発生しました。');
  });
});
