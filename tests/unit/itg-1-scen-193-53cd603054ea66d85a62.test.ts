import { describe, it, expect } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-193: 実行不可なとき、次回実行予定時刻は次営業日の指定時刻で返される', () => {
  it('should return shouldExecute=false, isBusinessDay=false, nextScheduledExecutionTime as next business day when non-business day', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = judgeSchedulerExecutionTiming(input) as any;

    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBe('17:30');
    expect(result.executionReason).toMatch(/営業日ではない/);
  });
});
