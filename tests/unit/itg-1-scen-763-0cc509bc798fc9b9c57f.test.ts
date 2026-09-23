import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-763: 日報提出期限に達し全員が提出済みのとき、未提出者リストが空になり通知メールは送信されない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('スケジューラ実行タイミング判定が成功し、shouldExecute=true が返される', async () => {
    // isBusinessDay スタブを設定し、現在日付が営業日である場合に true を返すようモック化
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // judgeSchedulerExecutionTiming 関数を以下の入力値で呼び出す
    // currentTimestamp='2024-01-15T17:30:00Z'（営業日の指定時刻）
    // scheduledExecutionTime='17:30'
    // executionTimeToleranceMinutes=5
    // timeZone='Asia/Tokyo'
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = await judgeSchedulerExecutionTiming(input);

    // 出力型 JudgeSchedulerExecutionTimingOutput の shouldExecute フィールドが true であることを検証
    expect(result.shouldExecute).toBe(true);

    // 出力型 JudgeSchedulerExecutionTimingOutput の isBusinessDay フィールドが true であることを検証
    expect(result.isBusinessDay).toBe(true);

    // 出力型 JudgeSchedulerExecutionTimingOutput の isWithinExecutionWindow フィールドが true であることを検証
    expect(result.isWithinExecutionWindow).toBe(true);

    // 出力型 JudgeSchedulerExecutionTimingOutput の nextScheduledExecutionTime フィールドが null であることを検証
    expect(result.nextScheduledExecutionTime).toBeNull();

    // 出力型 JudgeSchedulerExecutionTimingOutput の executionReason フィールドが '営業日の実行時刻内' であることを検証
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
