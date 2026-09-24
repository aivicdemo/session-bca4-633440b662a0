import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-197: 指定された許容誤差の範囲内で実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された許容誤差の範囲内で実行可能と判定される', async () => {
    // judgeSchedulerExecutionTiming関数を呼び出す際、以下の入力値を指定する：
    // - currentTimestamp: '2024-01-15T17:30:02Z'（営業日の指定時刻より2秒後）
    // - scheduledExecutionTime: '17:30'
    // - executionTimeToleranceMinutes: 5（デフォルト）
    // - timeZone: 'Asia/Tokyo'（デフォルト）
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:02Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 出力値JudgeSchedulerExecutionTimingOutputが以下の状態で返される
    // shouldExecute=true
    expect(result.shouldExecute).toBe(true);

    // isBusinessDay=true
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow=true
    expect(result.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime=null
    expect(result.nextScheduledExecutionTime).toBeNull();

    // executionReason='営業日の実行時刻内'
    expect(result.executionReason).toBe('営業日の実行時刻内');

    // これは現在時刻2024-01-15T17:30:02Z（Asia/Tokyo換算で翌日02:30:02）が
    // 指定時刻17:30から許容誤差5分以内（17:25～17:35）の範囲に該当し、
    // 営業日判定がtrueであるため、スケジューラは実行可能と判定される。
  });
});
