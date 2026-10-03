import {
  judgeSchedulerExecutionTiming,
  InvalidCurrentTimestampError,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-189: 現在時刻がISO 8601形式でないとき、タイムスタンプ形式エラーが発生する', () => {
  it('現在時刻がISO 8601形式でないとき、InvalidCurrentTimestampError が発生し、エラーメッセージが「現在時刻の形式が不正です。」である', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15 17:30:00',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await judgeSchedulerExecutionTiming(input);
      fail('InvalidCurrentTimestampError should be thrown');
    } catch (error) {
      if (error instanceof InvalidCurrentTimestampError) {
        expect(error.message).toBe('現在時刻の形式が不正です。');
      } else {
        throw error;
      }
    }
  });
});
