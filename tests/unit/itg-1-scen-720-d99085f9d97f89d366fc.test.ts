import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-720: 検知した未提出者の情報が整形され、管理画面表示用の一覧データと検知ログ記録用のデータが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の実行時刻内で呼び出されたとき、shouldExecute=true、isBusinessDay=true、isWithinExecutionWindow=true、nextScheduledExecutionTime=null、executionReason="営業日の実行時刻内"を返す', async () => {
    // 入力型 JudgeSchedulerExecutionTimingInput を構成
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z', // 営業日の実行時刻内
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // isBusinessDay をモック化し、currentTimestamp の日付が営業日であることを示す true を返す
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // judgeSchedulerExecutionTiming を実行
    const output: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 出力型 JudgeSchedulerExecutionTimingOutput の各フィールドを検証
    expect(output.shouldExecute).toBe(true);
    expect(output.isBusinessDay).toBe(true);
    expect(output.isWithinExecutionWindow).toBe(true);
    expect(output.nextScheduledExecutionTime).toBeNull();
    expect(output.executionReason).toBe('営業日の実行時刻内');
  });
});
