import { describe, it, expect } from '@jest/globals';
import {
  judgeBusinessDayAndDeadline,
  JudgeBusinessDayAndDeadlineInput,
  BusinessDayCalendarNotConfigured,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-171: 営業日カレンダーが未設定の場合にエラーが発生する', () => {
  it('営業日カレンダーが未設定の場合にエラーが発生する', async () => {
    // 営業日カレンダーが未設定の状態を前提に、テスト環境を初期化
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2025-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2025-01-15T16:30:00Z',
    };

    // judgeBusinessDayAndDeadline関数を呼び出す
    // BusinessDayCalendarNotConfiguredエラーが発生することを期待
    await expect(judgeBusinessDayAndDeadline(input)).rejects.toThrow(
      BusinessDayCalendarNotConfigured
    );
  });

  it('エラーメッセージが正しいこと', async () => {
    const input: JudgeBusinessDayAndDeadlineInput = {
      targetDate: '2025-01-15',
      teamLeaderId: 'leader-001',
      reporterUserId: 'reporter-001',
      submissionAttemptTimestamp: '2025-01-15T16:30:00Z',
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
