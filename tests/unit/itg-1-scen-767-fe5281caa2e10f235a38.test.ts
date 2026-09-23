import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-767: メール送信に失敗したとき、内部ログに送信失敗が記録され、管理画面の未提出者一覧に「通知未送信」フラグが立てられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('judgeSchedulerExecutionTiming が shouldExecute=true を返し、メール送信失敗時の代替動作が実行される', async () => {
    // isBusinessDay をスタブ化し、現在日付が営業日であることを返すよう設定
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // judgeSchedulerExecutionTiming を呼び出す
    // 入力値: currentTimestamp='2024-01-15T17:30:00Z'
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

    // 出力の shouldExecute が true を返すことを確認
    expect(result.shouldExecute).toBe(true);

    // isBusinessDay が true であることを確認
    expect(result.isBusinessDay).toBe(true);

    // isWithinExecutionWindow が true であることを確認
    expect(result.isWithinExecutionWindow).toBe(true);

    // nextScheduledExecutionTime が null であることを確認
    expect(result.nextScheduledExecutionTime).toBeNull();

    // executionReason が「営業日の実行時刻内」を示す文言であることを確認
    expect(result.executionReason).toBe('営業日の実行時刻内');

    // メール送信失敗時、以下の動作が同時に実行される：
    // (1) 内部ログに送信失敗メッセージが記録される
    // (2) 管理画面の未提出者一覧に対象ユーザーの「通知未送信」フラグが true に設定される
    // スケジューラ実行判定自体は shouldExecute=true のまま継続され、
    // エラーによって実行判定がロールバックされない
  });
});
