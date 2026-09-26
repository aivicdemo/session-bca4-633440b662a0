import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  ReporterNotFoundError,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-381: 指定された報告者が存在しないか既に無効化されている場合、エラーで拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReporterNotFoundError when reporter does not exist', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-999',
      teamLeaderId: 'TL-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
      fail('Expected ReporterNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ReporterNotFoundError);
      expect((error as Error).message).toBe('報告者が見つかりません。');
    }
  });

  it('should not call archivePastDailyReports when reporter not found', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-999',
      teamLeaderId: 'TL-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // expected
    }

    expect(dailyReportPersistence.archivePastDailyReports).not.toHaveBeenCalled();
  });

  it('should not call deactivateReporterInMaster when reporter not found', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-999',
      teamLeaderId: 'TL-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // expected
    }

    expect(userMasterPersistence.deactivateReporterInMaster).not.toHaveBeenCalled();
  });

  it('should not call recordReporterMasterChangeHistory when reporter not found', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-999',
      teamLeaderId: 'TL-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // expected
    }

    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
