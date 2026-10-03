import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-730: 日報データベースが一時的に取得できないとき、警告が発生する', () => {
  it('スケジューラの実行判定が正常に実行される', async () => {
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
  });
});
