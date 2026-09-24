import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-765: 日報期限リセット - スケジューラ実行タイミング判定動作確認', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な入力値でスケジューラ実行タイミング判定が実行され、営業日かつ実行時刻内の場合に true を返す', async () => {
    // テスト対象の処理 judgeSchedulerExecutionTiming を呼び出す際の入力値として、
    // currentTimestamp に有効な ISO 8601 形式の現在時刻を設定
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // 呼び出し先の isBusinessDay をスタブ化し、
    // 現在日付が営業日であることを示す true を返すよう設定
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // judgeSchedulerExecutionTiming を上記の入力値で実行
    const output: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 戻り値の型と内容を検証
    expect(output).toHaveProperty('shouldExecute');
    expect(typeof output.shouldExecute).toBe('boolean');
    expect(output).toHaveProperty('isBusinessDay');
    expect(output).toHaveProperty('isWithinExecutionWindow');
    expect(output).toHaveProperty('nextScheduledExecutionTime');
    expect(output).toHaveProperty('executionReason');

    // 営業日かつ実行時刻内の場合の期待結果
    expect(output.shouldExecute).toBe(true);
    expect(output.isBusinessDay).toBe(true);
  });
});
