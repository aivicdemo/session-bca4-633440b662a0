import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment.ts');

describe('SCEN-198: 許容誤差の下限境界で実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('現在時刻が実行予定時刻の下限境界（17:25:00）の場合、shouldExecuteがtrueとなる', async () => {
    // @ts-ignore
    const mockIsBusinessDay = isBusinessDay;
    mockIsBusinessDay.mockResolvedValue(true);

    // @ts-ignore
    const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming;
    mockJudgeSchedulerExecutionTiming.mockResolvedValueOnce({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    });

    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:25:00Z',
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

  it('現在時刻が実行予定時刻の下限境界より1秒前（17:24:59）の場合、範囲外となる', async () => {
    // @ts-ignore
    const mockIsBusinessDay = isBusinessDay;
    mockIsBusinessDay.mockResolvedValue(true);

    // @ts-ignore
    const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming;
    mockJudgeSchedulerExecutionTiming.mockResolvedValueOnce({
      shouldExecute: false,
      isBusinessDay: true,
      isWithinExecutionWindow: false,
      nextScheduledExecutionTime: '2024-01-15T17:30:00Z',
      executionReason: '実行時刻外',
    });

    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:24:59Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
  });
});
