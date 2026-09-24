import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-760: リセット処理が完了したとき、本日分の初期化完了フラグが真になり、実行時刻が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isBusinessDay が true を返すとき、shouldExecute が true で executionReason が「営業日の実行時刻内」となる', async () => {
    // isBusinessDay をスタブ化して真を返すように設定（営業日）
    (isBusinessDay as jest.Mock).mockReturnValueOnce(true);

    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 期待結果を検証：shouldExecute が true、isBusinessDay が true、isWithinExecutionWindow が true、nextScheduledExecutionTime が null、executionReason が「営業日の実行時刻内」を示す文言となること
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
