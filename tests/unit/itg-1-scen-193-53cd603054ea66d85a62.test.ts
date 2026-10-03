import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-193: 実行不可なとき、次回実行予定時刻は次営業日の指定時刻で返される', () => {
  it('営業日ではない土曜日のとき、shouldExecute=false、isBusinessDay=false、isWithinExecutionWindow=true、nextScheduledExecutionTime=次営業日月曜日の指定時刻、executionReason=営業日ではないが返される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBe('2024-01-15T17:30:00Z');
    expect(result.executionReason).toBe('営業日ではない');
  });
});
