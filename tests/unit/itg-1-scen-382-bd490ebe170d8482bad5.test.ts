import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  UnauthorizedLeaderError,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-382: 実行者がチームリーダーではない場合、権限エラーで拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedLeaderError when leader has no authorization', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'R001',
      teamLeaderId: 'TL999',
      deactivationReason: '配置変更',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
      fail('Expected UnauthorizedLeaderError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedLeaderError);
      expect((error as Error).message).toContain('この操作を実行する権限がありません。');
    }
  });

  it('should not call archivePastDailyReports on authorization failure', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'R001',
      teamLeaderId: 'TL999',
      deactivationReason: '配置変更',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // expected
    }

    expect(dailyReportPersistence.archivePastDailyReports).not.toHaveBeenCalled();
  });

  it('should not call deactivateReporterInMaster on authorization failure', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'R001',
      teamLeaderId: 'TL999',
      deactivationReason: '配置変更',
      executionTimestamp: new Date(),
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // expected
    }

    expect(userMasterPersistence.deactivateReporterInMaster).not.toHaveBeenCalled();
  });

  it('should not call recordReporterMasterChangeHistory on authorization failure', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'R001',
      teamLeaderId: 'TL999',
      deactivationReason: '配置変更',
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
