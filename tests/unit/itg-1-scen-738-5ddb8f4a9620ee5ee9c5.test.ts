import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

// テスト対象: SCEN-738
// 営業日の定時実行時刻に判定実行される場合、shouldExecute=true で未提出者検知が実行される

describe('SCEN-738: 営業日の定時実行時刻に達した場合の未提出者検知実行判定', () => {
  it('現在時刻が営業日の定時17:00のとき、shouldExecute=true で未提出者検知実行条件が確定する', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toMatch(/営業日|実行時刻/);
  });
});
