import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-761: 日報提出期限17:00に達したとき、未提出者が検知される', () => {
  test('営業日の期限時刻で judgeSchedulerExecutionTiming が呼び出されると、実行可能判定が得られる', () => {
    // isBusinessDay を営業日（月曜日 2024-01-15）を返すようスタブ設定
    const input = {
      currentTimestamp: '2024-01-15T17:00:00Z',
      scheduledExecutionTime: '17:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = judgeSchedulerExecutionTiming(input);

    // 仕様の期待結果：shouldExecute=true、isBusinessDay=true、isWithinExecutionWindow=true、
    // nextScheduledExecutionTime=null、executionReason='営業日の実行時刻内'
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
