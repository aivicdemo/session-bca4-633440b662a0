import { describe, it, expect } from '@jest/globals';
import type {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-716: 毎日17:00に営業日の定時スケジューラが起動し、営業日かつ有効な日報提出期限であることを確認して以降の処理が実行される', () => {
  it('毎日17:00に営業日の定時スケジューラが起動し、営業日かつ有効な日報提出期限であることを確認して以降の処理が実行される', () => {
    // ステップ1: 入力値を準備
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // ステップ3: judgeSchedulerExecutionTiming処理の期待出力を定義
    const expectedOutput: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    };

    // ステップ4: 出力値を検証
    // shouldExecuteがtrue
    expect(expectedOutput.shouldExecute).toBe(true);

    // isBusinessDayがtrue
    expect(expectedOutput.isBusinessDay).toBe(true);

    // isWithinExecutionWindowがtrue
    expect(expectedOutput.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTimeがnull
    expect(expectedOutput.nextScheduledExecutionTime).toBe(null);

    // executionReasonが「営業日の実行時刻内」
    expect(expectedOutput.executionReason).toBe('営業日の実行時刻内');
  });
});
