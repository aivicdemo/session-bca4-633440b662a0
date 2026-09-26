import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  NoActiveReportersError,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterValidationModule from '../../src/logic/reporter-master-management';

describe('SCEN-746: リマインダー送信対象が0人の場合、送信処理がスキップされ検知ログのみ記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('アクティブな報告者が存在しない場合、NoActiveReportersErrorが発生する', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay' as any).mockResolvedValue(true);
    jest.spyOn(reporterValidationModule, 'isReporterActiveAndValid' as any)
      .mockResolvedValue(false);

    const targetDate = new Date('2024-01-15'); // 営業日かつ本日以前
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(NoActiveReportersError);
    await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(
      '指定日付に日報提出対象の有効な報告者が存在しません。'
    );
  });
});
