import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment.ts');

describe('SCEN-197: 指定された許容誤差の範囲内で実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('現在時刻が実行予定時刻より2秒後の場合、許容誤差5分内でshouldExecuteがtrueとなる', async () => {
    // @ts-ignore
    const mockIsBusinessDay = isBusinessDay;
    mockIsBusinessDay.mockResolvedValue(true);

    // @ts-ignore
    const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming;
    mockJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    });

    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:02Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBe(null);
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
