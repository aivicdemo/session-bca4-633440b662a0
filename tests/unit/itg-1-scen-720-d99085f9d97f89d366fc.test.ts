import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput, JudgeSchedulerExecutionTimingOutput } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';

describe('SCEN-720: 検知した未提出者の情報が整形され、管理画面表示用の一覧データと検知ログ記録用のデータが生成される', () => {
  it('営業日の実行時刻内で呼び出されるとき、shouldExecuteがtrue、executionReasonが「営業日の実行時刻内」を返す', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result: JudgeSchedulerExecutionTimingOutput = await judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
