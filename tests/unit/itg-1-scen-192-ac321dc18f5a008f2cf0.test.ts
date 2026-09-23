import { describe, it, expect, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-192: 実行可能なとき、次回実行予定時刻はnullで返される', () => {
  it('should return correct output when execution timing is valid and within window', () => {
    // Stub isBusinessDay to return true
    jest.spyOn(require('../../src/logic/business-day-deadline-judgment'), 'isBusinessDay')
      .mockReturnValue(true);

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    // Verify the output matches the expected result
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
