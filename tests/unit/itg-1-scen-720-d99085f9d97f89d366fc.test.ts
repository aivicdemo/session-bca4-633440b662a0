import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-720: 検知した未提出者の情報が整形され、管理画面表示用の一覧データと検知ログ記録用のデータが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の実行時刻内では、judgeSchedulerExecutionTimingが検知情報を整形して返す', async () => {
    // テスト入力値の準備
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // isBusinessDay をモック化して営業日と判定するよう設定
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // judgeSchedulerExecutionTiming を呼び出す
    const result = await judgeSchedulerExecutionTiming(input);

    // 出力型 JudgeSchedulerExecutionTimingOutput の各フィールドを検証
    // shouldExecute が true（営業日かつ実行時刻内のため実行可能）
    expect(result.shouldExecute).toBe(true);

    // isBusinessDay が true（currentTimestamp の日付が営業日のため）
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow が true（currentTimestamp が scheduledExecutionTime ± executionTimeToleranceMinutes の範囲内のため）
    expect(result.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime が null（実行可能な場合は次回スケジュール予定時刻を記録しない）
    expect(result.nextScheduledExecutionTime).toBeNull();

    // executionReason が「営業日の実行時刻内」を示す文言であること
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
