import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  DeactivateReporterOutput,
  UnauthorizedLeaderError,
  isReporterActiveAndValid,
  IsReporterActiveAndValidInput,
} from '../../src/logic/reporter-master-management';
import {
  archivePastDailyReports,
  ArchivePastDailyReportsInput,
  ArchivePastDailyReportsOutput,
} from '../../src/logic/daily-report-persistence';
import {
  deactivateReporterInMaster,
  DeactivateReporterInMasterInput,
  DeactivateReporterInMasterOutput,
  persistReporterMasterChangeHistory,
  PersistReporterMasterChangeHistoryInput,
  PersistReporterMasterChangeHistoryOutput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/reporter-master-management.ts', () => ({
  isReporterActiveAndValid: jest.fn(),
  recordReporterMasterChangeHistory: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence.ts', () => ({
  archivePastDailyReports: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  deactivateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-382: 実行者がチームリーダーではない場合、権限エラーで拒否される', () => {
  let mockIsReporterActiveAndValid: jest.Mock;
  let mockArchivePastDailyReports: jest.Mock;
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockRecordReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsReporterActiveAndValid = require('../../src/logic/reporter-master-management.ts').isReporterActiveAndValid as jest.Mock;
    mockArchivePastDailyReports = require('../../src/logic/daily-report-persistence.ts').archivePastDailyReports as jest.Mock;
    mockDeactivateReporterInMaster = require('../../src/logic/user-master-persistence.ts').deactivateReporterInMaster as jest.Mock;
    mockRecordReporterMasterChangeHistory = require('../../src/logic/reporter-master-management.ts').recordReporterMasterChangeHistory as jest.Mock;

    // 報告者は有効な状態
    // @ts-ignore
    mockIsReporterActiveAndValid.mockResolvedValue(true);
  });

  it('実行者がチームリーダーではない場合、UnauthorizedLeaderErrorが発生し、依存先は呼び出されない', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'R001',
      teamLeaderId: 'TL999',
      deactivationReason: '配置変更',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    try {
      await deactivateReporter(input);
      fail('UnauthorizedLeaderError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedLeaderError);
      expect(error.message).toContain('この操作を実行する権限がありません。');
    }

    // 依存先が呼び出されていないことを確認
    expect(mockArchivePastDailyReports).not.toHaveBeenCalled();
    expect(mockDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
