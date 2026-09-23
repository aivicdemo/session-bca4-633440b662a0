import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-750: 毎日0:00に前日の日報提出期限が確定し、本日分の日報受付対象者が確定する', () => {
  it('営業日の0:00に実行タイミング判定がtrueを返す', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T00:00:00Z',
      scheduledExecutionTime: '00:00',
      executionTimeToleranceMinutes: undefined,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBe(null);
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
