import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-732: スケジューラ設定が有効なとき、処理が正常に完了する', () => {
  it('必要な入力値で呼び出しされる場合、正常に動作する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = await judgeSchedulerExecutionTiming(input);
    expect(result).toBeDefined();
    expect(result.shouldExecute).toBeDefined();
    expect(result.isBusinessDay).toBeDefined();
    expect(result.isWithinExecutionWindow).toBeDefined();
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
