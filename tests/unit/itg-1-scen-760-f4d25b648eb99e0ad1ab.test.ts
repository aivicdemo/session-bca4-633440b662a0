import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-760: リセット処理が完了したとき、本日分の初期化完了フラグが真になり、実行時刻が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isBusinessDay が true を返すとき、shouldExecute が true で executionReason が「営業日の実行時刻内」となる', async () => {
    // isBusinessDay をスタブ化して真を返すように設定（営業日）
    jest.mocked(isBusinessDay).mockReturnValue(true);

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 期待結果を検証
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
