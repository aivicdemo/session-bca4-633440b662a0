import { describe, it, expect } from '@jest/globals';
import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError, type JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-759: リセット処理中にシステムエラーが発生したとき、処理が中断され「日次リセット処理に失敗しました。再実行してください」が発生する', () => {
  it('無効なスケジューラ設定でエラーが発生し処理が中断される', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidSchedulerConfigurationError);
  });
});
