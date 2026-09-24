jest.mock('../../src/logic/reporter-master-management', () => ({
  isReporterActiveAndValid: jest.fn(),
  recordReporterMasterChangeHistory: jest.fn(),
  deactivateReporter: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  archivePastDailyReports: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  deactivateReporterInMaster: jest.fn(),
}));

import { deactivateReporter, isReporterActiveAndValid, recordReporterMasterChangeHistory, UnauthorizedLeaderError } from '../../src/logic/reporter-master-management';
import { archivePastDailyReports } from '../../src/logic/daily-report-persistence';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.Mock;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.Mock;
const mockedDeactivateReporter = deactivateReporter as jest.Mock;

describe('SCEN-382: 実行者がチームリーダーではない場合、権限エラーで拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('実行者TL999が対象報告者R001の所属チームのリーダーではない場合、UnauthorizedLeaderErrorをスローする', async () => {
    const reporterId = 'R001';
    const teamLeaderId = 'TL999';
    const deactivationReason = '配置変更';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(true);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new UnauthorizedLeaderError('この操作を実行する権限がありません。');
    });

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    await expect(deactivateReporter(input)).rejects.toThrow(UnauthorizedLeaderError);
  });

  it('エラーメッセージが「この操作を実行する権限がありません。」を含むこと', async () => {
    const reporterId = 'R001';
    const teamLeaderId = 'TL999';
    const deactivationReason = '配置変更';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(true);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new UnauthorizedLeaderError('この操作を実行する権限がありません。');
    });

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    try {
      await deactivateReporter(input);
      fail('Should have thrown UnauthorizedLeaderError');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedLeaderError);
      expect((error as Error).message).toContain('この操作を実行する権限がありません。');
    }
  });

  it('archivePastDailyReportsが実行されないこと', async () => {
    const reporterId = 'R001';
    const teamLeaderId = 'TL999';
    const deactivationReason = '配置変更';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(true);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new UnauthorizedLeaderError('この操作を実行する権限がありません。');
    });

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // エラーが予期される
    }

    expect(mockedArchivePastDailyReports).toHaveBeenCalledTimes(0);
  });

  it('deactivateReporterInMasterが実行されないこと', async () => {
    const reporterId = 'R001';
    const teamLeaderId = 'TL999';
    const deactivationReason = '配置変更';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(true);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new UnauthorizedLeaderError('この操作を実行する権限がありません。');
    });

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // エラーが予期される
    }

    expect(mockedDeactivateReporterInMaster).toHaveBeenCalledTimes(0);
  });

  it('recordReporterMasterChangeHistoryが実行されないこと', async () => {
    const reporterId = 'R001';
    const teamLeaderId = 'TL999';
    const deactivationReason = '配置変更';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(true);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new UnauthorizedLeaderError('この操作を実行する権限がありません。');
    });

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    try {
      await deactivateReporter(input);
    } catch (error) {
      // エラーが予期される
    }

    expect(mockedRecordReporterMasterChangeHistory).toHaveBeenCalledTimes(0);
  });
});
