import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-187: 営業日だが指定時刻の許容範囲外のときは、実行不可と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日だが指定時刻の許容範囲外の場合、実行不可', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:20:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.nextScheduledExecutionTime).toBe('17:30');
    expect(result.executionReason).toBe('実行時刻外または非営業日');
  });
});
