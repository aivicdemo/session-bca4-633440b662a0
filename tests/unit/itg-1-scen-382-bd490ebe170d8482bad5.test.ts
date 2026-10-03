import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  UnauthorizedLeaderError,
} from '../../src/logic/reporter-master-management';
import * as reporterMasterManagement from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-382: 実行者がチームリーダーではない場合、権限エラーで拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedLeaderError when executor is not the team leader of the target reporter', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'R001',
      teamLeaderId: 'TL999',
      deactivationReason: '配置変更',
      executionTimestamp: new Date(),
    };

    await expect(deactivateReporter(input)).rejects.toThrow(UnauthorizedLeaderError);
    await expect(deactivateReporter(input)).rejects.toThrow('この操作を実行する権限がありません。');

    expect(dailyReportPersistence.archivePastDailyReports).not.toHaveBeenCalled();
    expect(userMasterPersistence.deactivateReporterInMaster).not.toHaveBeenCalled();
  });
});
