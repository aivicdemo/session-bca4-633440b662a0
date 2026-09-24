import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-187: 営業日だが指定時刻の許容範囲外のときは、実行不可と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日だが指定時刻の許容範囲外の場合、実行不可', async () => {
    jest.mocked(isBusinessDay).mockResolvedValue({
      targetDate: '2024-01-15',
      isBusinessDay: true,
      timeZone: 'Asia/Tokyo',
    } as any);

    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:25:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.nextScheduledExecutionTime).toBe('2024-01-15T17:30:00Z');
    expect(result.executionReason).toBe('実行時刻外');
  });
});
