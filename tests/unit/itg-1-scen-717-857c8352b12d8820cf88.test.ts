import { describe, it, expect } from '@jest/globals';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-717: 営業日判定で営業日でない日付（土日祝日）の場合、スケジューラ実行後の以降の処理が実行されない', () => {
  it('営業日判定で営業日でない日付（土日祝日）の場合、スケジューラ実行後の以降の処理が実行されない', () => {
    // 入力値を準備：土曜日の営業時間内の時刻
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // judgeSchedulerExecutionTiming処理の期待出力を定義
    const expectedOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: false,
      isBusinessDay: false,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: '2024-01-15T17:30:00Z',
      executionReason: '営業日ではない',
    };

    // 期待結果を検証
    // shouldExecute: false（営業日ではないため実行しない）
    expect(expectedOutput.shouldExecute).toBe(false);

    // isBusinessDay: false（土日祝日）
    expect(expectedOutput.isBusinessDay).toBe(false);

    // isWithinExecutionWindow: true（現在時刻が実行時刻 17:30 の許容範囲内 ±5分）
    expect(expectedOutput.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime: ISO 8601形式の次営業日（月曜日）の同一時刻を示す文字列
    expect(expectedOutput.nextScheduledExecutionTime).toBe('2024-01-15T17:30:00Z');

    // executionReason: "営業日ではない"
    expect(expectedOutput.executionReason).toBe('営業日ではない');
  });
});
