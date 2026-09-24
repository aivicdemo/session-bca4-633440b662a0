import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-186: 営業日の指定時刻内に判定すると、実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の指定時刻内の場合、実行可能と判定', async () => {
    jest.mocked(isBusinessDay).mockResolvedValue({
      targetDate: '2024-01-15',
      isBusinessDay: true,
      timeZone: 'Asia/Tokyo',
    } as any);

    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
