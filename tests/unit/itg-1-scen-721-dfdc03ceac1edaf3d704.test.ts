import { judgeSchedulerExecutionTiming, JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-721: 本日の提出済み日報データが取得され、未提出者検知結果と合わせてリーダーの管理画面に表示するデータセットが構成される', () => {
  it('営業日の定時実行時刻（17:30）内に、スケジューラ実行が肯定的に判定されること', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    const result: JudgeSchedulerExecutionTimingOutput = judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
