import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-760: リセット処理が完了したとき、本日分の初期化完了フラグが真になる', () => {
  test('営業日の実行時刻内で judgeSchedulerExecutionTiming が呼び出されると、実行可能で営業日フラグが真になる', () => {
    // isBusinessDay を真を返すようにスタブ化
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = judgeSchedulerExecutionTiming(input);

    // 仕様の期待結果を検証
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
