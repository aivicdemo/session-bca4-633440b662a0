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

describe('SCEN-383: 実行者が対象報告者の所属チームのリーダーではない場合、権限エラーで拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedLeaderError when executor is not the leader of the target reporters team', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-valid-id',
      teamLeaderId: 'TL-not-leader',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    await expect(deactivateReporter(input)).rejects.toThrow(UnauthorizedLeaderError);
    await expect(deactivateReporter(input)).rejects.toThrow('この操作を実行する権限がありません。');

    expect(userMasterPersistence.deactivateReporterInMaster).not.toHaveBeenCalled();
    expect(dailyReportPersistence.archivePastDailyReports).not.toHaveBeenCalled();
  });
});
