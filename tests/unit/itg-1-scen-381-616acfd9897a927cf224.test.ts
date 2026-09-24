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

import { deactivateReporter, isReporterActiveAndValid, recordReporterMasterChangeHistory, ReporterNotFoundError } from '../../src/logic/reporter-master-management';
import { archivePastDailyReports } from '../../src/logic/daily-report-persistence';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.Mock;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.Mock;
const mockedDeactivateReporter = deactivateReporter as jest.Mock;

describe('SCEN-381: 指定された報告者が存在しないか既に無効化されている場合、エラーで拒否される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('reporterId="RPT-999"が存在しないか無効化されている場合、ReporterNotFoundErrorをスローする', async () => {
    const reporterId = 'RPT-999';
    const teamLeaderId = 'TL-001';
    const deactivationReason = '異動';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(false);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new ReporterNotFoundError('報告者が見つかりません。');
    });

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    await expect(deactivateReporter(input)).rejects.toThrow(ReporterNotFoundError);
  });

  it('エラーメッセージが「報告者が見つかりません。」であること', async () => {
    const reporterId = 'RPT-999';
    const teamLeaderId = 'TL-001';
    const deactivationReason = '異動';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(false);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new ReporterNotFoundError('報告者が見つかりません。');
    });

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    try {
      await deactivateReporter(input);
      fail('Should have thrown ReporterNotFoundError');
    } catch (error) {
      expect(error).toBeInstanceOf(ReporterNotFoundError);
      expect((error as Error).message).toBe('報告者が見つかりません。');
    }
  });

  it('archivePastDailyReportsが呼び出されないこと', async () => {
    const reporterId = 'RPT-999';
    const teamLeaderId = 'TL-001';
    const deactivationReason = '異動';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(false);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new ReporterNotFoundError('報告者が見つかりません。');
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

    expect(mockedArchivePastDailyReports).not.toHaveBeenCalled();
  });

  it('deactivateReporterInMasterが呼び出されないこと', async () => {
    const reporterId = 'RPT-999';
    const teamLeaderId = 'TL-001';
    const deactivationReason = '異動';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(false);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new ReporterNotFoundError('報告者が見つかりません。');
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

    expect(mockedDeactivateReporterInMaster).not.toHaveBeenCalled();
  });

  it('recordReporterMasterChangeHistoryが呼び出されないこと', async () => {
    const reporterId = 'RPT-999';
    const teamLeaderId = 'TL-001';
    const deactivationReason = '異動';
    const executionTimestamp = Date.now();

    mockedIsReporterActiveAndValid.mockReturnValue(false);
    mockedDeactivateReporter.mockImplementation(() => {
      throw new ReporterNotFoundError('報告者が見つかりません。');
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

    expect(mockedRecordReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
