import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  deactivateReporter,
  isReporterActiveAndValid,
  ReporterNotFoundError,
  DeactivateReporterInput,
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

describe('SCEN-381: 指定された報告者が存在しないか既に無効化されている場合、エラーで拒否される', () => {
  let mockIsReporterActiveAndValid: jest.Mock;
  let mockArchivePastDailyReports: jest.Mock;
  let mockDeactivateReporterInMaster: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;
    mockArchivePastDailyReports = archivePastDailyReports as jest.Mock;
    mockDeactivateReporterInMaster = deactivateReporterInMaster as jest.Mock;

    // 報告者が存在しないか既に無効化されている
    // @ts-ignore
    mockIsReporterActiveAndValid.mockResolvedValue(false);
  });

  it('報告者が存在しないか既に無効化されている場合、ReporterNotFoundError をスロー', async () => {
    const input: DeactivateReporterInput = {
      reporterId: 'RPT-999',
      teamLeaderId: 'TL-001',
      deactivationReason: '異動',
      executionTimestamp: new Date(),
    };

    // テスト対象関数を実行し、エラーが発生することを検証
    await expect(deactivateReporter(input)).rejects.toThrow(ReporterNotFoundError);

    // エラーメッセージを検証
    try {
      await deactivateReporter(input);
    } catch (error) {
      if (error instanceof ReporterNotFoundError) {
        expect(error.message).toBe('報告者が見つかりません。');
      }
    }

    // archivePastDailyReports が呼ばれていないことを検証
    expect(mockArchivePastDailyReports).not.toHaveBeenCalled();

    // deactivateReporterInMaster が呼ばれていないことを検証
    expect(mockDeactivateReporterInMaster).not.toHaveBeenCalled();
  });
});
