import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-752: 本日0:00時点で5名の有効な報告者が取得され、本日分の日報受付が初期化される', () => {
  it('営業日の00:00時点で、shouldExecute=true、isBusinessDay=true、isWithinExecutionWindow=true、nextScheduledExecutionTime=null、executionReason="営業日の実行時刻内"を返す', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T00:00:00Z',
      scheduledExecutionTime: '00:00',
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
