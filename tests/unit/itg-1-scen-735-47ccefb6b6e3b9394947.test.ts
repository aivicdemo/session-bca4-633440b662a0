import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

// テスト対象: SCEN-735
// 現在の日時が実行時刻の許容範囲外のとき、未提出者チェックがスキップされる

describe('SCEN-735: 現在時刻が実行時刻外のときスキップ', () => {
  it('現在時刻16:00が実行時刻17:30より前のとき、shouldExecute=false で処理がスキップされる', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T16:00:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.nextScheduledExecutionTime).toBeDefined();
    expect(result.executionReason).toBe('実行時刻外');
  });
});
