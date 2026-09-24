import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-717: 営業日判定で営業日でない日付（土日祝日）の場合、スケジューラ実行後の以降の処理が実行されない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(businessDayModule, 'isBusinessDay').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('営業日ではない場合、shouldExecute=false で実行されない', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeDefined();
    expect(result.nextScheduledExecutionTime).not.toBeNull();
    expect(result.executionReason).toBe('営業日ではない');
  });
});
