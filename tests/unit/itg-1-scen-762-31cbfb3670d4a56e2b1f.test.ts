import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-762: 日報提出期限に達し未提出者が1名以上いるとき、管理画面の未提出者一覧に表示され、リーダーへ通知メールが送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('スケジューラが営業日の指定時刻に実行されるとき、shouldExecute が true となり実行が許可される', async () => {
    // isBusinessDay を営業日を返すようスタブ設定
    jest.mocked(isBusinessDay).mockReturnValue(true);

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // スケジューラ実行判定の検証
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    // 未提出者検知とリマインダー送信の処理につながる実行許可を確認
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
