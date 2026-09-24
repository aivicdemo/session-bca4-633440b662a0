import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-196: デフォルト許容誤差（5分）の範囲内で実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('デフォルト許容誤差（5分）の範囲内で実行可能と判定される', async () => {
    // 現在時刻を ISO 8601 形式で「2024-01-15T17:32:00Z」（営業日の17時32分）に設定する
    // スケジューラの実行予定時刻を「17:30」（HH:mm形式）に設定する
    // executionTimeToleranceMinutes を指定せず、デフォルト許容誤差5分を適用する
    // timeZone を指定せず、デフォルト「Asia/Tokyo」を適用する
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:32:00Z',
      scheduledExecutionTime: '17:30',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 戻り値の shouldExecute が true であることを検証する
    expect(result.shouldExecute).toBe(true);

    // 戻り値の isBusinessDay が true であることを検証する
    expect(result.isBusinessDay).toBe(true);

    // 戻り値の isWithinExecutionWindow が true であることを検証する
    // （現在時刻17:32は実行予定時刻17:30±5分の範囲内：17:25～17:35に該当）
    expect(result.isWithinExecutionWindow).toBe(true);

    // 戻り値の nextScheduledExecutionTime が null であることを検証する
    // （実行可能な場合は次回予定時刻を出力しない）
    expect(result.nextScheduledExecutionTime).toBeNull();

    // 戻り値の executionReason が「営業日の実行時刻内」の文言を含むことを検証する
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
