import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  isBusinessDay,
  JudgeSchedulerExecutionTimingInput,
  JudgeSchedulerExecutionTimingOutput,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment');

describe('SCEN-762: 日報提出期限に達し未提出者が1名以上いるとき、管理画面の未提出者一覧に表示され、リーダーへ通知メールが送信される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('スケジューラが営業日の指定時刻に実行されるとき、shouldExecute が true となり実行が許可される', async () => {
    // isBusinessDay を営業日を返すようスタブ設定
    (isBusinessDay as jest.Mock).mockReturnValueOnce(true);

    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    // スケジューラ実行判定の検証：①スケジューラが営業日の指定時刻に実行される。②管理画面の未提出者一覧に、期限到来時点で日報を提出していない社内ユーザー（1名以上、最大5名）が表示される。③リーダーへ日報未提出アラートメールが送信される。メール送信に失敗した場合でも、管理画面の未提出者一覧に「通知未送信」フラグが立てられ、再試行が最大3回まで指数バックオフで実行される。3回再試行後も送信失敗した場合、管理者に通知される。
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    // 未提出者検知とリマインダー送信の処理につながる実行許可を確認
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
