import { describe, it, expect } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-196: デフォルト許容誤差（5分）の範囲内で実行可能と判定される', () => {
  it('should judge execution as possible within default tolerance (5 minutes)', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:32:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = judgeSchedulerExecutionTiming(input) as any;

    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
