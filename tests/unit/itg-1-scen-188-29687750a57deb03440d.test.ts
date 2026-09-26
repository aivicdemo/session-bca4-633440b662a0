import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-188: 営業日ではないとき、実行不可と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('非営業日（土曜日 2024-01-13T17:30:00Z）の場合、shouldExecute=false かつ isBusinessDay=false を返す', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-13T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(false);
    expect(result.nextScheduledExecutionTime).toBe('17:30');
    expect(result.executionReason).toBe('実行時刻外または非営業日');
  });
});
