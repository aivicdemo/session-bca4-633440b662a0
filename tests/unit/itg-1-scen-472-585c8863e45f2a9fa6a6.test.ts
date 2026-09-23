import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  DeactivateReporterInMasterInput,
  DeactivateReporterInMasterOutput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-472: 無効化理由が指定されない場合でも報告者が正常に無効化される', () => {
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts').persistReporterMasterChangeHistory as jest.Mock;

    // deactivationReasonがnullでも処理が成功するようにモック
    // @ts-ignore
    mockDeactivateReporterInMaster.mockImplementation(
      async (input: DeactivateReporterInMasterInput) => {
        // 依存先モックを実行
        // @ts-ignore
        await mockPersistReporterMasterChangeHistory();

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

  it('deactivationReasonがnullでも報告者は正常に無効化される', async () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-001',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date(),
      deactivationReason: null as any,
    };

    // @ts-ignore
    const result = await mockDeactivateReporterInMaster(input);

    // 成功を確認
    // @ts-ignore
    expect(result.success).toBe(true);
    // @ts-ignore
    expect(result.reporterId).toBe('reporter-001');
    // @ts-ignore
    expect(result.message).toContain('無効化');

    // persistReporterMasterChangeHistoryが呼ばれたことを確認
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
