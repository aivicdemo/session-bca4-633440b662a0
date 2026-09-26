import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';

describe('SCEN-766: 営業日かつ実行時刻内のとき、shouldExecuteがtrueになり実行可能と判定される', () => {
  it('営業日の指定時刻内で実行タイムウィンドウに該当するとき、出力型JudgeSchedulerExecutionTimingOutputが正常に返される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
