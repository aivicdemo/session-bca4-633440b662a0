import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-735: 現在の日時が提出期限より前のとき、未提出者チェックがスキップされる', () => {
  it('should skip non-submission check when current time is before scheduled execution window', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T16:00:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    // Expected results per SCEN-735:
    // (1) shouldExecute = false (16:00 is outside 17:25-17:35 window)
    expect(result.shouldExecute).toBe(false);

    // (2) isBusinessDay = true (2024-01-15 is Monday)
    expect(result.isBusinessDay).toBe(true);

    // (3) isWithinExecutionWindow = false (16:00 is not within tolerance of 17:30)
    expect(result.isWithinExecutionWindow).toBe(false);

    // (4) nextScheduledExecutionTime = '2024-01-15T17:30:00Z'
    expect(result.nextScheduledExecutionTime).toMatch(/2024-01-15T17:30:00/);

    // (5) executionReason = '実行時刻外'
    expect(result.executionReason).toBe('実行時刻外または非営業日');
  });
});
