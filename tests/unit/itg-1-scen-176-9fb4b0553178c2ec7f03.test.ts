import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  BusinessDayCalendarNotConfigured,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-176: 営業日カレンダーが空のとき例外がスローされる', () => {
  it('営業日カレンダーが空または未設定の状態でBusinessDayCalendarNotConfigured例外がスローされる', async () => {
    // 営業日カレンダーが空または未設定の状態でシステムを初期化
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    // BusinessDayCalendarNotConfigured例外がスローされることを期待
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      BusinessDayCalendarNotConfigured
    );
  });

  it('例外メッセージが正しいこと', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2024-01-15',
      teamLeaderId: 'leader001',
      reporterUserId: 'reporter001',
      submissionAttemptTimestamp: '2024-01-15T16:30:00Z',
    };

    try {
      await judgeBusinessDayAndDeadline(input);
      throw new Error('Expected BusinessDayCalendarNotConfigured to be thrown');
    } catch (error) {
      if (error instanceof BusinessDayCalendarNotConfigured) {
        expect(error.message).toBe('営業日カレンダーが未設定のため判定できません。');
      } else {
        throw error;
      }
    }
  });
});
