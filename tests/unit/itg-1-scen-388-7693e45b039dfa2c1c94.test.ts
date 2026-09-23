import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import { MasterUpdateFailureError } from '../../src/logic/reporter-master-management';
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

describe('SCEN-388: 報告者IDが空または不正な形式の場合、エラーで拒否される', () => {
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
  });

  it('reporterIdが空文字列の場合、MasterUpdateFailureErrorが発生する', async () => {
    const input: DeactivateReporterInput = {
      reporterId: '',
      teamLeaderId: 'leader-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
      fail('MasterUpdateFailureError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(MasterUpdateFailureError);
      expect((error as Error).message).toContain('報告者マスタの更新に失敗しました。');
    }
  });
});
