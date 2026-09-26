import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, type JudgeSchedulerExecutionTimingInput, type JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-755: 5名全員が前日に日報を提出した場合、未提出者リストが空になる', () => {
  it('営業日の定時実行時刻（17:30±5分）で全員提出済みの場合に未提出者リストが空で確定されることを判定', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z', // 営業日の定時スケジューラ実行タイミング
      scheduledExecutionTime: '17:30', // HH:mm形式
      executionTimeToleranceMinutes: 5, // デフォルト値
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
