import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-737: 報告者5名全員が17:00までに日報を提出した場合、未提出者リストが空となり、リーダーへのアラートメールが送信されない', () => {
  it('should return shouldExecute=true at scheduled execution time on business day', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00+09:00',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input) as JudgeSchedulerExecutionTimingOutput;

    // Expected conditions per SCEN-737:
    // (1) shouldExecute = true
    expect(result.shouldExecute).toBe(true);

    // (2) isBusinessDay = true
    expect(result.isBusinessDay).toBe(true);

    // (3) isWithinExecutionWindow = true
    expect(result.isWithinExecutionWindow).toBe(true);

    // (4) nextScheduledExecutionTime = null (executing now)
    expect(result.nextScheduledExecutionTime).toBeNull();

    // (5) executionReason = '営業日の実行時刻内'
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
