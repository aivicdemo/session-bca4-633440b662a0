jest.mock('../../src/logic/reporter-master-management', () => ({
  isReporterActiveAndValid: jest.fn(),
  recordReporterMasterChangeHistory: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  archivePastDailyReports: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  deactivateReporterInMaster: jest.fn(),
}));

import {
  isReporterActiveAndValid,
  recordReporterMasterChangeHistory,
  deactivateReporter,
  UnauthorizedLeaderError,
} from '../../src/logic/reporter-master-management';
import { archivePastDailyReports } from '../../src/logic/daily-report-persistence';
import { deactivateReporterInMaster } from '../../src/logic/user-master-persistence';

const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.MockedFunction<any>;
const mockedArchivePastDailyReports = archivePastDailyReports as jest.MockedFunction<any>;
const mockedDeactivateReporterInMaster = deactivateReporterInMaster as jest.MockedFunction<any>;
const mockedRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-383: 実行者が対象報告者の所属チームのリーダーではない場合、権限エラーで拒否される', () => {
  const reporterId = 'RPT-001';
  const teamLeaderId = 'TL-999';
  const deactivationReason = '異動';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('報告者が有効な状態であっても、teamLeaderIdが対象報告者の所属チームのリーダーではない場合、UnauthorizedLeaderErrorをスロー', async () => {
    mockedIsReporterActiveAndValid.mockResolvedValue(true);

    const input = {
      reporterId,
      teamLeaderId,
      deactivationReason,
      executionTimestamp,
    };

    await expect(deactivateReporter(input)).rejects.toThrow(UnauthorizedLeaderError);
  });

  it('エラーメッセージが「この操作を実行する権限がありません。」を含む', async () => {
    mockedIsReporterActiveAndValid.mockResolvedValue(true);

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
      expect((error as Error).message).toContain('この操作を実行する権限がありません');
    }
  });

  it('出力型 DeactivateReporterOutput は返されず、deactivateReporterInMaster は実行されない', async () => {
    mockedIsReporterActiveAndValid.mockResolvedValue(true);

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

  it('archivePastDailyReports は実行されない', async () => {
    mockedIsReporterActiveAndValid.mockResolvedValue(true);

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

  it('recordReporterMasterChangeHistory は実行されない', async () => {
    mockedIsReporterActiveAndValid.mockResolvedValue(true);

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
