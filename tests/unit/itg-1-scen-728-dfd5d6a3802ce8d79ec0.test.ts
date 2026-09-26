import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';

describe('SCEN-728: スケジューラ設定が無効なときのエラー検証', () => {
  it('InvalidSchedulerConfigurationErrorが発生し、エラー文言が「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」である', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await judgeSchedulerExecutionTiming(input);
      throw new Error('InvalidSchedulerConfigurationErrorが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
      expect((error as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
    }
  });

  it('処理は中断され、JudgeSchedulerExecutionTimingOutput出力型の値は返却されない', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      await judgeSchedulerExecutionTiming(input);
      throw new Error('InvalidSchedulerConfigurationErrorが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
    }
  });
});
