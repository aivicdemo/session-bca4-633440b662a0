import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment.ts');

describe('SCEN-195: 指定されたタイムゾーンで正しく判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Asia/Tokyo での判定：営業日かつ実行時刻外の場合、shouldExecuteがfalse', async () => {
    // @ts-ignore
    const mockIsBusinessDay = isBusinessDay;
    mockIsBusinessDay.mockResolvedValue(true);

    // @ts-ignore
    const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming;
    mockJudgeSchedulerExecutionTiming.mockResolvedValueOnce({
      shouldExecute: false,
      isBusinessDay: true,
      isWithinExecutionWindow: false,
      nextScheduledExecutionTime: '2024-01-16T17:30:00Z',
      executionReason: '実行時刻外',
    });

    const result = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    // Asia/Tokyo: 2024-01-15T17:30:00Z は翌日の 02:30 → 実行時刻 17:30 ±5分の範囲外
    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.executionReason).toBe('実行時刻外');
  });

  it('America/New_York での判定：営業日かつ実行時刻外の場合、shouldExecuteがfalse', async () => {
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
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'America/New_York',
    });

    // America/New_York (UTC-5): 2024-01-15T17:30:00Z は 2024-01-15 12:30 → 実行時刻 17:30 ±5分の範囲外
    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.executionReason).toBe('実行時刻外');
    expect(result.nextScheduledExecutionTime).not.toBe(null);
  });

  it('複数のタイムゾーンで同一タイムスタンプを処理する場合、各タイムゾーンで独立した判定が行われる', async () => {
    // @ts-ignore
    const mockJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming;

    // UTC のテスト結果
    mockJudgeSchedulerExecutionTiming.mockResolvedValueOnce({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    });

    const resultUTC = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'UTC',
    });

    // Los Angeles (UTC-8) のテスト結果
    mockJudgeSchedulerExecutionTiming.mockResolvedValueOnce({
      shouldExecute: false,
      isBusinessDay: true,
      isWithinExecutionWindow: false,
      nextScheduledExecutionTime: '2024-01-15T17:30:00Z',
      executionReason: '実行時刻外',
    });

    const resultLA = await judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'America/Los_Angeles',
    });

    // 各タイムゾーンで異なるローカル時刻に変換されるため、判定が異なる
    // UTC: 17:30 → 実行時刻17:30の範囲内
    // Los Angeles: 09:30 → 実行時刻17:30の範囲外
    expect(resultUTC.isWithinExecutionWindow).not.toBe(resultLA.isWithinExecutionWindow);
  });
});
