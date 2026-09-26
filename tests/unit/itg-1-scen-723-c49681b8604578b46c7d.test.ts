import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-723: 検知した未提出者に対して催促の必要性と方法（メール送信の優先度・内容）が判定される', () => {
  it('営業日かつ実行時刻の許容範囲内の場合、スケジューラ実行判定が肯定的（shouldExecute=true）であること', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
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
