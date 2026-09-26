import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-716: 毎日17:00に営業日の定時スケジューラが起動し、営業日かつ有効な日報提出期限であることを確認して以降の処理が実行される', () => {
  it('営業日の定時（17:00）に、スケジューラ実行判定が肯定的（shouldExecute=true）であること', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result: JudgeSchedulerExecutionTimingOutput = judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
