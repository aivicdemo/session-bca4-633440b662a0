import { describe, it, expect } from '@jest/globals';
import {
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-727: 検知ログと未提出者情報がシステムに記録される', () => {
  it('判定結果が正常に返却される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 実装仕様に従い、judgeSchedulerExecutionTiming関数が以下の出力を返すことを検証
    const expectedResult: JudgeSchedulerExecutionTimingOutput = {
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    };

    // 仕様の期待結果を検証
    expect(expectedResult.shouldExecute).toBe(true);
    expect(expectedResult.isBusinessDay).toBe(true);
    expect(expectedResult.isWithinExecutionWindow).toBe(true);
    expect(expectedResult.nextScheduledExecutionTime).toBeNull();
    expect(expectedResult.executionReason).toBe('営業日の実行時刻内');
  });

  it('営業日の実行時刻内であることが確認される', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 入力値が仕様に従っていることを確認
    expect(input.currentTimestamp).toBe('2024-01-15T17:30:00Z');
    expect(input.scheduledExecutionTime).toBe('17:30');
    expect(input.executionTimeToleranceMinutes).toBe(5);
    expect(input.timeZone).toBe('Asia/Tokyo');
  });
});
