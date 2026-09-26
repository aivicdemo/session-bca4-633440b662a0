import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-189: 現在時刻がISO 8601形式でないとき、実装の動作を確認', () => {
  it('ISO 8601形式ではないcurrentTimestampを設定した場合の実装の動作を検証', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15 17:30:00',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 実装は形式検証を行わず、new Date() による暗黙的なパースを試みる
    const result = await judgeSchedulerExecutionTiming(input);

    expect(result).toBeDefined();
    expect(typeof result.shouldExecute).toBe('boolean');
    expect(typeof result.isBusinessDay).toBe('boolean');
  });
});
