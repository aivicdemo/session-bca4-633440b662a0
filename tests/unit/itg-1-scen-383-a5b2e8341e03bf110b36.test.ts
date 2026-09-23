import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  UnauthorizedLeaderError,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import {
  archivePastDailyReports,
} from '../../src/logic/daily-report-persistence';
import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
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

describe('SCEN-383: 実行者が対象報告者の所属チームのリーダーではない場合、権限エラーで拒否される', () => {
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

    // @ts-ignore
    mockIsReporterActiveAndValid.mockResolvedValue(true);
  });

  it('実行者が対象報告者の所属チームのリーダーではない場合、UnauthorizedLeaderErrorで拒否される', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'reporter-123',
      teamLeaderId: 'leader-999',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
      fail('UnauthorizedLeaderError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedLeaderError);
      expect((error as Error).message).toContain('この操作を実行する権限がありません。');
    }

    expect(mockArchivePastDailyReports).not.toHaveBeenCalled();
    expect(mockDeactivateReporterInMaster).not.toHaveBeenCalled();
    expect(mockRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
