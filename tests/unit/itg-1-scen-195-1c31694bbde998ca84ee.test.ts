import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-195: 指定されたタイムゾーンで正しく判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Asia/Tokyo で現在時刻 2024-01-15T17:30:00Z（日本時間 2024-01-16 02:30）を入力した場合、実行時刻外と判定される', async () => {
    // タイムゾーン Asia/Tokyo を指定し、現在時刻を ISO 8601 形式で入力する
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z', // 日本時間では翌日 02:30
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // isBusinessDay は true（ローカル日付 2024-01-16 が営業日と仮定）
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow は false（ローカル時刻 02:30 は 17:30 ±5分の範囲外）
    expect(result.isWithinExecutionWindow).toBe(false);

    // shouldExecute は false
    expect(result.shouldExecute).toBe(false);

    // executionReason は「実行時刻外」
    expect(result.executionReason).toBe('実行時刻外');

    // nextScheduledExecutionTime は次営業日の実行予定時刻（ISO 8601 形式）
    expect(result.nextScheduledExecutionTime).not.toBeNull();
  });

  it('America/New_York（UTC-5）で同一タイムスタンプを入力した場合、ローカル日付・時刻が異なり実行時刻外と判定される', async () => {
    // America/New_York タイムゾーン（UTC-5、冬時間）で同一タイムスタンプを入力
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z', // NY時間では 2024-01-15 12:30
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'America/New_York',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // ローカル日付は 2024-01-15、ローカル時刻は 12:30 となり
    // isBusinessDay は true（2024-01-15 が営業日と仮定）
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow は false（12:30 は 17:30 ±5分の範囲外）
    expect(result.isWithinExecutionWindow).toBe(false);

    // shouldExecute は false
    expect(result.shouldExecute).toBe(false);

    // executionReason は「実行時刻外」
    expect(result.executionReason).toBe('実行時刻外');

    // nextScheduledExecutionTime は次営業日の実行予定時刻
    expect(result.nextScheduledExecutionTime).not.toBeNull();
  });

  it('複数のタイムゾーン（Asia/Tokyo、UTC、America/Los_Angeles）で同一の ISO 8601 タイムスタンプを入力した場合、各タイムゾーンで正しくローカル時刻に変換される', async () => {
    // Asia/Tokyo
    const inputTokyo: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };
    const resultTokyo = await judgeSchedulerExecutionTiming(inputTokyo);

    // UTC
    const inputUTC: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'UTC',
    };
    const resultUTC = await judgeSchedulerExecutionTiming(inputUTC);

    // America/Los_Angeles
    const inputLA: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'America/Los_Angeles',
    };
    const resultLA = await judgeSchedulerExecutionTiming(inputLA);

    // Asia/Tokyo: ローカル時刻 02:30 → 実行時刻外
    expect(resultTokyo.isWithinExecutionWindow).toBe(false);

    // UTC: ローカル時刻 17:30 → 実行時刻内
    expect(resultUTC.isWithinExecutionWindow).toBe(true);

    // Los Angeles: ローカル時刻 09:30 → 実行時刻外
    expect(resultLA.isWithinExecutionWindow).toBe(false);

    // スケジューラ実行判定はタイムゾーン指定に応じて変わることを確認
    expect(resultTokyo.shouldExecute).toBe(false);
    expect(resultUTC.shouldExecute).toBe(true);
    expect(resultLA.shouldExecute).toBe(false);
  });
});
