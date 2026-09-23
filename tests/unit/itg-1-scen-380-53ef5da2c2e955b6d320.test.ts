import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  isReporterActiveAndValid,
  recordReporterMasterChangeHistory,
  DeactivateReporterInput,
  DeactivateReporterOutput,
} from '../../src/logic/reporter-master-management';
import {
  archivePastDailyReports,
} from '../../src/logic/daily-report-persistence';
import {
  deactivateReporterInMaster,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/reporter-master-management.ts');
jest.mock('../../src/logic/daily-report-persistence.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-380: チームリーダーが有効な報告者を無効化し、過去日報をアーカイブして変更履歴を記録する', () => {
  let mockIsReporterActiveAndValid: jest.Mock;
  let mockArchivePastDailyReports: jest.Mock;
  let mockDeactivateReporterInMaster: jest.Mock;
  let mockRecordReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
    mockArchivePastDailyReports = archivePastDailyReports as jest.Mock;
    mockDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;
    mockRecordReporterMasterChangeHistory = recordReporterMasterChangeHistory as jest.Mock;

    // 報告者が有効であることを確認
    // @ts-ignore
    mockIsReporterActiveAndValid.mockResolvedValue(true);

    // 過去日報5件をアーカイブ
    // @ts-ignore
    mockArchivePastDailyReports.mockResolvedValue({
      archivedCount: 5,
      archiveLocation: 'archive_table',
      activeReporterListUpdated: true,
    });

    // 報告者マスタから無効化
    // @ts-ignore
    mockDeactivateReporterInMaster.mockResolvedValue(true);

    // 変更履歴を記録
    // @ts-ignore
    mockRecordReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'CHG20240115001',
    });
  });

  it('有効な報告者を無効化し、過去日報をアーカイブして変更履歴を記録する', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT002',
      teamLeaderId: 'TL001',
      deactivationReason: '異動',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    // テスト対象関数を実行
    const result: DeactivateReporterOutput = await deactivateReporter(input);

    // 期待結果を検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT002');
    expect(result.archivedReportCount).toBe(5);
    expect(result.message).toBe('報告者RPT002を無効化し、5件の過去日報をアーカイブしました。');
    expect(result.changeHistoryId).toBe('CHG20240115001');

    // isReporterActiveAndValid が呼ばれたことを検証
    // @ts-ignore
    expect(mockIsReporterActiveAndValid).toHaveBeenCalledWith({
      reporterId: 'RPT002',
    });

    // archivePastDailyReports が呼ばれたことを検証
    // @ts-ignore
    expect(mockArchivePastDailyReports).toHaveBeenCalledWith({
      reporterId: 'RPT002',
    });

    // deactivateReporterInMaster が呼ばれたことを検証
    // @ts-ignore
    expect(mockDeactivateReporterInMaster).toHaveBeenCalledWith({
      reporterId: 'RPT002',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    });

    // recordReporterMasterChangeHistory が呼ばれたことを検証
    // @ts-ignore
    expect(mockRecordReporterMasterChangeHistory).toHaveBeenCalledWith({
      reporterId: 'RPT002',
      teamLeaderId: 'TL001',
      deactivationReason: '異動',
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
    });
  });
});
