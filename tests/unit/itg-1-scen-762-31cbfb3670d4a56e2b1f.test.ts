import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-762: 日報提出期限に達し未提出者が1名以上いるとき、管理画面に表示され通知メール送信される', () => {
  test('営業日の期限時刻でスケジューラが実行可能な状態であることを検証する', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = judgeSchedulerExecutionTiming(input);

    // スケジューラが営業日の指定時刻に実行される条件を検証
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
