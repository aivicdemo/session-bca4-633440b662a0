import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-717: 営業日判定で営業日でない日付（土日祝日）の場合、スケジューラ実行後の以降の処理が実行されない', () => {
  it('土曜日（営業日ではない）の場合、スケジューラが実行されない（shouldExecute=false）であること', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result: JudgeSchedulerExecutionTimingOutput = judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).not.toBeNull();
    expect(result.executionReason).toBe('実行時刻外または非営業日');
  });
});
