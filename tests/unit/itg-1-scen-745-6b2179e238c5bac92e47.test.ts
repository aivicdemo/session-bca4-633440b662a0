import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ReporterMasterAccessError,
} from '../../src/logic/reporter-master-management';

describe('SCEN-745: 報告者IDが空または不正な形式の場合、エラーが発生し処理が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('teamLeaderIdが空文字列の場合、ReporterMasterAccessErrorが発生する', async () => {
    const targetDate = new Date('2024-01-15'); // 有効な営業日
    const emptyTeamLeaderId = '';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId: emptyTeamLeaderId,
    };

    await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(ReporterMasterAccessError);
    await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(
      '報告者マスタの取得に失敗しました。'
    );
  });

  it('teamLeaderIdが不正な形式の場合、ReporterMasterAccessErrorが発生する', async () => {
    const targetDate = new Date('2024-01-15');
    const invalidTeamLeaderIds = [null, undefined, 123, '!!!'];

    for (const invalidId of invalidTeamLeaderIds) {
      const input: GetActiveReportersForSubmissionCheckInput = {
        targetDate,
        teamLeaderId: invalidId as any,
      };

      await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(ReporterMasterAccessError);
      await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(
        '報告者マスタの取得に失敗しました。'
      );
    }
  });
});
