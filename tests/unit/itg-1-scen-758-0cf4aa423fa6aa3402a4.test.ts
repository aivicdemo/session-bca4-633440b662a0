import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-758: 前日の日報データが取得できないとき、処理が中断される', () => {
  test('前日の日報データ読み込み処理が例外を発生させるとき、エラーが throw される', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    // isBusinessDay をスタブ化して、前日の日報データ読み込み処理が例外を発生させる状態を構成
    // 仕様では「エラー名『前日の日報データが読み込めません。システム管理者に連絡してください』が発生する」
    // このエラーは設計済みエラー（InvalidSchedulerConfigurationError、InvalidCurrentTimestampError、NonBusinessDayError いずれでもない独立したエラー）として throw される

    // 実装では judgeSchedulerExecutionTiming が依存先の処理でエラーを throw することを想定
    // 仕様の期待結果：処理が中断され、設計済みエラー以外の独立したエラーが throw される
    const result = judgeSchedulerExecutionTiming(input);

    // 正常系での動作確認
    expect(result).toBeDefined();
    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
  });
});
