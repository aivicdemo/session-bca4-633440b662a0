import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeBusinessDayAndDeadline, BusinessDayCalendarNotConfigured } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-171: 営業日カレンダーが未設定の場合にエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日カレンダーが未設定の状態でBusinessDayCalendarNotConfiguredエラーが発生する', async () => {
    const input = {
      targetDate: '2025-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2025-01-15T16:30:00Z'
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(BusinessDayCalendarNotConfigured);
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow('営業日カレンダーが未設定のため判定できません。');
  });
});
