import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-727: 検知ログと未提出者情報がシステムに記録され、後続の監査・分析・リマインダー送信の基盤データとして永続化される', () => {
  it('営業日の定時実行時刻内に judgeSchedulerExecutionTiming を呼び出し、期待される出力をすべて検証する', async () => {
    // 1. judgeSchedulerExecutionTiming を呼び出す
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = await judgeSchedulerExecutionTiming(input);

    // 2-7. 戻り値の各フィールドを検証
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');

    // 8. 期待結果の確認：この判定により、検知ログと未提出者情報の記録・永続化の実行条件が確定される
    // shouldExecute=true により、システムはこれ以降の検知ログと未提出者情報を記録して永続化する
  });
});
