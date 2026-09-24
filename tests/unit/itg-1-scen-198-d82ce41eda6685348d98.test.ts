import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-198: 許容誤差の下限境界で実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('許容誤差の下限境界で実行可能と判定される', async () => {
    // isBusinessDay処理をスタブ化し、現在日付が営業日であることを返すよう設定する
    // judgeSchedulerExecutionTiming処理を以下の入力値で呼び出す
    // currentTimestamp='2024-01-15T17:29:55Z'
    // scheduledExecutionTime='17:30'
    // executionTimeToleranceMinutes=5（デフォルト）
    // timeZone='Asia/Tokyo'（デフォルト）
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:29:55Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 出力型JudgeSchedulerExecutionTimingOutputのフィールド値を検証する
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

    // 現在時刻17:29:55は予定時刻17:30から許容誤差下限5分以内（17:25:00以上17:35:00以下の範囲内）に該当し、
    // 営業日であるため実行可能と判定される
  });
});
