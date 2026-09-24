import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-716: 毎日17:00に営業日の定時スケジューラが起動し、営業日かつ有効な日報提出期限であることを確認して以降の処理が実行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(businessDayModule, 'isBusinessDay').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('営業日の定時実行時刻内にスケジューラが実行される（shouldExecute=true）', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
