jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
}));

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  TargetDateInvalidError,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-392: 指定日付が将来日である場合、TargetDateInvalidError を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('success が false を返し、TargetDateInvalidError が発生する、または reporters は空配列、totalCount は 0、message にはエラー文言が格納される', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const teamLeaderId = 'TL001';

    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate: futureDate,
      teamLeaderId,
    };

    try {
      const result = await getActiveReportersForSubmissionCheck(input);

      // 実装がエラーを返した場合（TargetDateInvalidError をスロー可能）
      expect(result.success).toBe(false);
      expect(result.reporters.length).toBe(0);
      expect(result.totalCount).toBe(0);
      expect(result.message).toBe('提出対象日付は営業日かつ本日以前である必要があります。');
    } catch (err: any) {
      // 実装がエラーをスロー場合（TargetDateInvalidError の場合）
      expect(err).toBeInstanceOf(TargetDateInvalidError);
      expect(err.message).toBe('提出対象日付は営業日かつ本日以前である必要があります。');
    }
  });
});
