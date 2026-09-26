import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-734: 登録済み報告者のリストが空のとき、警告が発生して処理が継続される', () => {
  it('should return expected values when reporter list is empty', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    // (1) shouldExecute is false (when reporter list is empty, execution is not needed)
    expect(result.shouldExecute).toBe(false);

    // (2) isBusinessDay is true (2024-01-15 is Monday)
    expect(result.isBusinessDay).toBe(true);

    // (3) isWithinExecutionWindow is true (17:30 is at scheduled time)
    expect(result.isWithinExecutionWindow).toBe(true);

    // (4) executionReason contains warning about no reporters
    expect(result.executionReason).toContain('チームに報告者が登録されていません');

    // (5) nextScheduledExecutionTime is set for next business day
    expect(result.nextScheduledExecutionTime).toBeTruthy();

    // (6) No error is thrown, processing continues normally
    expect(result).toBeDefined();
  });
});
