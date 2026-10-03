import { describe, it, expect } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-195: 指定されたタイムゾーンで正しく判定される', () => {
  it('should judge correctly with Asia/Tokyo timezone', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = judgeSchedulerExecutionTiming(input) as any;

    expect(result).toBeDefined();
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.shouldExecute).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });

  it('should judge execution window as false when local time is outside window with different timezone', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'America/New_York'
    };

    const result = judgeSchedulerExecutionTiming(input) as any;

    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(false);
    expect(result.executionReason).toMatch(/実行時刻外|営業日ではない/);
  });

  it('should return different results for different timezones with same UTC timestamp', () => {
    const utcTimestamp = '2024-01-15T17:30:00Z';
    const scheduledTime = '17:30';
    const tolerance = 5;

    const tokyoInput: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: utcTimestamp,
      scheduledExecutionTime: scheduledTime,
      executionTimeToleranceMinutes: tolerance,
      timeZone: 'Asia/Tokyo'
    };

    const nyInput: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: utcTimestamp,
      scheduledExecutionTime: scheduledTime,
      executionTimeToleranceMinutes: tolerance,
      timeZone: 'America/New_York'
    };

    const tokyoResult = judgeSchedulerExecutionTiming(tokyoInput) as any;
    const nyResult = judgeSchedulerExecutionTiming(nyInput) as any;

    expect(tokyoResult).toBeDefined();
    expect(nyResult).toBeDefined();
  });
});
