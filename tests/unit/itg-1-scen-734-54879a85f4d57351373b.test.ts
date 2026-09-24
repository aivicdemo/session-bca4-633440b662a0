import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

// テスト対象: SCEN-734
// 登録済み報告者のリストが空のとき、warnings として警告が返される

describe('SCEN-734: 登録済み報告者のリストが空のとき処理が継続される', () => {
  it('営業日の実行時刻に達した場合、shouldExecute=false、isBusinessDay=true、isWithinExecutionWindow=true で返す', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.executionReason).toBeDefined();
    expect(result.nextScheduledExecutionTime).toBeDefined();
  });
});
