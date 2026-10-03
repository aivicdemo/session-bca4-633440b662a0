import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  deactivateReporter,
  DeactivateReporterInput,
  MasterUpdateFailureError,
} from '../../src/logic/reporter-master-management';
import * as dailyReportPersistence from '../../src/logic/daily-report-persistence';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-388: 報告者IDが空または不正な形式の場合、エラーで拒否される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MasterUpdateFailureError when reporterId is empty string', async () => {
    const input: DeactivateReporterInput = {
      reporterId: '',
      teamLeaderId: 'valid-leader-id',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    await expect(deactivateReporter(input)).rejects.toThrow(MasterUpdateFailureError);
    await expect(deactivateReporter(input)).rejects.toThrow('報告者マスタの更新に失敗しました。');

    expect(dailyReportPersistence.archivePastDailyReports).not.toHaveBeenCalled();
    expect(userMasterPersistence.deactivateReporterInMaster).not.toHaveBeenCalled();
  });
});
