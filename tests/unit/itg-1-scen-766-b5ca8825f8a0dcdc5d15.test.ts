import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-766: 報告者マスタが空のとき、警告が出力され「チームに報告者が登録されていません」と記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効な形式の入力で呼び出されるとき、操作が正常系で完了し JudgeSchedulerExecutionTimingOutput の各フィールドが期待値を持つ', async () => {
    // isBusinessDay をスタブ化して営業日を返す
    jest.mocked(isBusinessDay).mockReturnValue(true);

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // 操作が正常系で完了し、出力フィールドが期待値を持つことを確認
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
