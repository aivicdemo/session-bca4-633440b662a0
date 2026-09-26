import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  TargetDateInvalidError,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-740: スケジューラ実行時刻が営業日でない場合、リマインダー送信が中止される', () => {
  let targetDate: Date;
  let teamLeaderId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    targetDate = new Date('2024-01-06'); // 土曜日（非営業日）
    teamLeaderId = 'TL001';
  });

  it('営業日でない日付を指定した場合、TargetDateInvalidErrorが発生する', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay' as any).mockResolvedValue(false);

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(TargetDateInvalidError);
    await expect(getActiveReportersForSubmissionCheck(input)).rejects.toThrow(
      '提出対象日付は営業日かつ本日以前である必要があります。'
    );
  });
});
