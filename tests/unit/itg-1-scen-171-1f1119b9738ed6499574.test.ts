import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  BusinessDayCalendarNotConfigured,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-171: 営業日カレンダーが未設定の場合にエラーが発生する', () => {
  it('営業日カレンダーが未設定の場合にBusinessDayCalendarNotConfiguredエラーが発生する', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2025-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2025-01-15T16:30:00Z',
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      BusinessDayCalendarNotConfigured
    );

    try {
      await judgeBusinessDayAndDeadline(input);
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessDayCalendarNotConfigured);
      expect(error.message).toBe('営業日カレンダーが未設定のため判定できません。');
    }
  });
});
