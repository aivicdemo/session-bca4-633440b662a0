import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-195: 指定されたタイムゾーンで正しく判定される', () => {
  it('Asia/Tokyoで2024-01-15T17:30:00Z（日本時間2024-01-16 02:30）を入力したとき、isBusinessDay=true、isWithinExecutionWindow=false、shouldExecute=false、executionReason=実行時刻外が返される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.shouldExecute).toBe(false);
    expect(result.executionReason).toBe('実行時刻外');
    expect(result.nextScheduledExecutionTime).toEqual(expect.any(String));
  });

  it('America/New_YorkでUTC時刻2024-01-15T17:30:00Z（NY時間2024-01-15 12:30）を入力したとき、isBusinessDay=true、isWithinExecutionWindow=false、shouldExecute=false、executionReason=実行時刻外が返される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'America/New_York',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.shouldExecute).toBe(false);
    expect(result.executionReason).toBe('実行時刻外');
    expect(result.nextScheduledExecutionTime).toEqual(expect.any(String));
  });

  it('複数のタイムゾーンで同一のISO 8601タイムスタンプを入力したとき、各タイムゾーン独立で判定される', async () => {
    const utcTimestamp = '2024-01-15T17:30:00Z';
    const scheduledTime = '17:30';
    const tolerance = 5;

    const tokyoInput: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: utcTimestamp,
      scheduledExecutionTime: scheduledTime,
      executionTimeToleranceMinutes: tolerance,
      timeZone: 'Asia/Tokyo',
    };

    const laInput: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: utcTimestamp,
      scheduledExecutionTime: scheduledTime,
      executionTimeToleranceMinutes: tolerance,
      timeZone: 'America/Los_Angeles',
    };

    const tokyoResult: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(tokyoInput);
    const laResult: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(laInput);

    expect(tokyoResult.isBusinessDay).toBe(true);
    expect(laResult.isBusinessDay).toBe(true);
    expect(tokyoResult.isWithinExecutionWindow).toBe(false);
    expect(laResult.isWithinExecutionWindow).toBe(false);
  });
});
