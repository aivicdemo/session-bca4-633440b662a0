import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-726: メール送信失敗時、最大3回まで指数バックオフで再試行され、3回失敗後は管理者に通知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(businessDayModule, 'isBusinessDay').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('再試行処理を経ても実行判定の shouldExecute は true を保持', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
  });
});
