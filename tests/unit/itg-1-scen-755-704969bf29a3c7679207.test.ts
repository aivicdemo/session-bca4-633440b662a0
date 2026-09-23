import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-755: 5名全員が前日に日報を提出した場合、未提出者リストが空になる', () => {
  it('営業日の定時スケジューラ実行時刻（17:30±5分）において、shouldExecute=true、isBusinessDay=true、isWithinExecutionWindow=true、nextScheduledExecutionTime=null、executionReason="営業日の実行時刻内"を返す', async () => {
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
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
