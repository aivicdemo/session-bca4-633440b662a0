import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-199: 許容誤差の上限境界で実行可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('許容誤差の上限境界で実行可能と判定される', async () => {
    // isBusinessDay処理をスタブ化し、現在日付が営業日であることを返すよう設定する
    // judgeSchedulerExecutionTiming処理を以下の入力値で呼び出す
    // currentTimestamp='2024-01-15T17:35:00Z'
    // （スケジュール実行予定時刻の17:30から5分経過した時点）
    // scheduledExecutionTime='17:30'
    // executionTimeToleranceMinutes=5（デフォルト値）
    // timeZone='Asia/Tokyo'（デフォルト値）
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:35:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 戻り値の出力型JudgeSchedulerExecutionTimingOutputの各フィールドを検証する
    // shouldExecute=true（営業日かつ実行時刻の許容誤差の上限境界内のため実行すべき）
    expect(result.shouldExecute).toBe(true);

    // isBusinessDay=true（営業日）
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow=true
    // （現在時刻17:35:00がスケジュール実行予定時刻17:30±5分の範囲内に該当）
    expect(result.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime=null（実行可能な場合はnull）
    expect(result.nextScheduledExecutionTime).toBeNull();

    // executionReason='営業日の実行時刻内'
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
