import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, type JudgeSchedulerExecutionTimingInput, type JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-751: 前日に提出された日報が過去データとしてアーカイブされ、未提出者リストが確定する', () => {
  it('営業日の指定時刻（17:30）でスケジューラが実行可能であることを判定', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z', // 営業日の指定時刻
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
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
