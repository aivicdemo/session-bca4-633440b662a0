import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-727: 検知ログと未提出者情報がシステムに記録され、後続の監査・分析・リマインダー送信の基盤データとして永続化される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(businessDayModule, 'isBusinessDay').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('検知ログ記録の基盤となる実行判定が正常に実行される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
