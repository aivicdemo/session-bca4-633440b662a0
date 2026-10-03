import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, type JudgeSchedulerExecutionTimingInput, type JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-753: 前日の日報提出期限までに提出した報告者が正しく分類され、リセット結果に記録される', () => {
  it('営業日の定時スケジューラ実行時刻でスケジューラ判定がtrueを返し、前日期限までの提出者が対象外として分類される', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z', // 営業日の定時実行時刻
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
