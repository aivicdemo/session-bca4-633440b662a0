import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeBusinessDayAndDeadline, BusinessDayCalendarNotConfigured } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-176: 営業日カレンダーが空のとき例外がスローされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日カレンダーが空または未設定の状態でBusinessDayCalendarNotConfiguredエラーが発生する', async () => {
    const input = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z'
    };

    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(BusinessDayCalendarNotConfigured);
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow('営業日カレンダーが未設定のため判定できません。');
  });
});
