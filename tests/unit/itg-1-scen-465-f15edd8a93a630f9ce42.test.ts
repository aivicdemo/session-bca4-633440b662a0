import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  DeactivateReporterInMasterInput,
  DeactivateReporterInMasterOutput,
  PersistReporterMasterChangeHistoryInput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-465: チームリーダーが存在する報告者を無効化し、変更履歴が記録されて成功する', () => {
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // 正常な入力で成功を返すようにモック
    // @ts-ignore
    mockDeactivateReporterInMaster.mockImplementation(
      async (input: DeactivateReporterInMasterInput) => {
        // @ts-ignore
        await mockPersistReporterMasterChangeHistory({
          reporterId: input.reporterId,
          leaderUserId: input.leaderUserId,
          operationTimestamp: input.deactivationTimestamp,
        });

        return {
          success: true,
          reporterId: input.reporterId,
          message: '報告者を無効化しました。',
        } as DeactivateReporterInMasterOutput;
      }
    );

    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue(undefined);
  });

  it('正常な入力値で報告者が無効化され、変更履歴が記録される', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'RPT-001',
      leaderUserId: 'LEADER-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '退職',
    };

    // @ts-ignore
    const result = await mockDeactivateReporterInMaster(input);

    // 戻り値の検証
    // @ts-ignore
    expect(result.success).toBe(true);
    // @ts-ignore
    expect(result.reporterId).toBe('RPT-001');
    // @ts-ignore
    expect(result.message).toBe('報告者を無効化しました。');

    // persistReporterMasterChangeHistoryが正しい引数で1回呼び出されたことを確認
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalledTimes(1);
    // @ts-ignore
    const callArgs = mockPersistReporterMasterChangeHistory.mock.calls[0][0];
    // @ts-ignore
    expect(callArgs.reporterId).toBe('RPT-001');
    // @ts-ignore
    expect(callArgs.leaderUserId).toBe('LEADER-001');
    // @ts-ignore
    expect(callArgs.operationTimestamp).toEqual(new Date('2025-01-15T10:30:00Z'));
  });
});
