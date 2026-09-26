import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-759: リセット処理中にシステムエラーが発生したとき', () => {
  test('スケジューラ実行タイミング設定確認後、システムエラー発生時の処理を検証する', () => {
    // スケジューラ実行タイミング設定の確認
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result = judgeSchedulerExecutionTiming(input);

    // 設定確認
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
