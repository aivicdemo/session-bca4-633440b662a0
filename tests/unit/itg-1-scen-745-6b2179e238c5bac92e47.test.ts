import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ReporterMasterAccessError,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-745: 報告者IDが空または不正な形式の場合、エラーが発生し処理が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('teamLeaderIdが空文字列の場合、ReporterMasterAccessErrorが発生する', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = '';

    // isBusinessDay をスタブ化
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    try {
      await getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      });
      throw new Error('ReporterMasterAccessError が発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof ReporterMasterAccessError)) {
        throw error;
      }
      expect(error.message).toContain('報告者マスタの取得に失敗しました。');
      // isBusinessDay および isReporterActiveAndValid は実行されない
      expect(jest.mocked(isBusinessDay)).not.toHaveBeenCalled();
    }
  });

  it('teamLeaderIdがnullの場合、ReporterMasterAccessErrorが発生する', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = null as any;

    try {
      await getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      });
      throw new Error('ReporterMasterAccessError が発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof ReporterMasterAccessError)) {
        throw error;
      }
      expect(error.message).toContain('報告者マスタの取得に失敗しました。');
    }
  });

  it('teamLeaderIdが数値の場合、ReporterMasterAccessErrorが発生する', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 123 as any;

    try {
      await getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      });
      throw new Error('ReporterMasterAccessError が発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof ReporterMasterAccessError)) {
        throw error;
      }
      expect(error.message).toContain('報告者マスタの取得に失敗しました。');
    }
  });

  it('teamLeaderIdが記号のみの場合、ReporterMasterAccessErrorが発生する', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = '!!!';

    try {
      await getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      });
      throw new Error('ReporterMasterAccessError が発生すべきですが、発生しませんでした。');
    } catch (error) {
      if (!(error instanceof ReporterMasterAccessError)) {
        throw error;
      }
      expect(error.message).toContain('報告者マスタの取得に失敗しました。');
    }
  });
});
