import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, type JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-758: 前日の日報データが取得できないとき、処理が中断され「前日の日報データが読み込めません。システム管理者に連絡してください」が発生する', () => {
  it('スケジューラ実行タイミング判定により前日データ読み込み対象の判定が可能', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
  });
});
