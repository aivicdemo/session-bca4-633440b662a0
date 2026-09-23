import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckOutput,
  TargetDateInvalidError,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-740: スケジューラ実行時刻が営業日でない場合、リマインダー送信が中止される', () => {
  let targetDate: string;
  let teamLeaderId: string;

  beforeEach(() => {
    targetDate = '2024-01-06';
    teamLeaderId = 'TL001';
  });

  it('should return success false with TargetDateInvalidError when targetDate is not a business day', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay').mockReturnValue(false);

    const result: GetActiveReportersForSubmissionCheckOutput = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(TargetDateInvalidError);
    expect(result.error?.message).toBe('提出対象日付は営業日かつ本日以前である必要があります。');
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
