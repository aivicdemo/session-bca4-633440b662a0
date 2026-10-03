import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, type JudgeSchedulerExecutionTimingInput, type JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-750: 毎日0:00に前日の日報提出期限が確定し、本日分の日報受付対象者が確定する', () => {
  it('営業日の0:00時点でスケジューラが実行可能であることを判定', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T00:00:00Z', // 月曜日、営業日、0:00 UTC
      scheduledExecutionTime: '00:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
