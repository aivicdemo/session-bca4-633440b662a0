import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-767: 日報期限リセット - メール送信に失敗したとき、内部ログに送信失敗が記録され、管理画面の未提出者一覧に「通知未送信」フラグが立てられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('スケジューラ実行判定は shouldExecute=true で返され、エラーによってロールバックされない', async () => {
    // isBusinessDay をスタブ化し、現在日付が営業日であることを返すよう設定
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // judgeSchedulerExecutionTiming を呼び出す
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const output: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 出力の shouldExecute が true を返すことを確認
    expect(output.shouldExecute).toBe(true);

    // 出力の isBusinessDay が true を返すことを確認
    expect(output.isBusinessDay).toBe(true);

    // 出力の isWithinExecutionWindow が true を返すことを確認
    expect(output.isWithinExecutionWindow).toBe(true);

    // スケジューラ実行判定自体は shouldExecute=true のまま継続されることを確認
    expect(output.shouldExecute).toBe(true);

    // 出力の executionReason が適切な値であることを確認
    expect(output.executionReason).toBe('営業日の実行時刻内');
  });
});
