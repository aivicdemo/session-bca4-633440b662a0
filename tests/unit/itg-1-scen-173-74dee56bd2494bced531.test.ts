import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  InvalidTargetDate,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-173: 対象日付が不正な形式または範囲外の場合にエラーが発生する', () => {
  const invalidDates = ['2024-13-45', '2024/01/01', 'invalid-date', ''];

  invalidDates.forEach((invalidDate) => {
    it(`targetDateが'${invalidDate}'の場合にInvalidTargetDateエラーが発生する`, async () => {
      const input: JudgeBusinessDayAndDeadlineInput = {
        targetDate: invalidDate,
        teamLeaderId: 'leader-001',
        reporterUserId: 'reporter-001',
        submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
      };

      await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
        InvalidTargetDate
      );

      try {
        await judgeBusinessDayAndDeadline(input);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidTargetDate);
        expect(error.message).toBe('対象日付が不正です。');
      }
    });
  });
});
