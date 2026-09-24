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
    targetDate = new Date('2024-01-06'); // 土曜日
    teamLeaderId = 'TL001';
  });

  it('営業日でない日付ではTargetDateInvalidErrorが発生する', async () => {
    jest.spyOn(businessDayModule, 'isBusinessDay').mockResolvedValue(false);

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate,
      teamLeaderId,
    };

    const result: GetActiveReportersForSubmissionCheckOutput =
      await getActiveReportersForSubmissionCheck(input);

    // success フィールドが false であることを確認
    expect(result.success).toBe(false);

    // TargetDateInvalidError エラーが発生していることを確認
    expect(result.error).toBeInstanceOf(TargetDateInvalidError);

    // エラーメッセージが正確であることを確認
    expect(result.error?.message).toBe('提出対象日付は営業日かつ本日以前である必要があります。');

    // reporters は空配列、totalCount は 0 となることを確認
    expect(result.reporters).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
