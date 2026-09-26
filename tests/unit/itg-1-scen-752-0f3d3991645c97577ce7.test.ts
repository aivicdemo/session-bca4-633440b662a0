import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, type JudgeSchedulerExecutionTimingInput, type JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-752: 本日0:00時点で5名の有効な報告者が取得され、本日分の日報受付が初期化される', () => {
  it('営業日0:00時点で本日分の日報受付初期化条件が満たされることを判定', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T00:00:00Z', // ISO 8601形式、本日0:00時点
      scheduledExecutionTime: '00:00', // HH:mm形式
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
