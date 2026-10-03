import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-728: スケジューラ実行時刻が空または不正な形式のとき、エラーが発生して処理が中断される', () => {
  it('scheduledExecutionTimeが空文字列の場合、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidSchedulerConfigurationError);
  });

  it('エラー文言が「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」である', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await judgeSchedulerExecutionTiming(input);
      fail('InvalidSchedulerConfigurationErrorが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
      expect((error as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
    }
  });
});
