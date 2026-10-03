import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
} from '../../src/logic/business-day-deadline-judgment';
import type {
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-191: 実行予定時刻が未設定のとき、スケジューラ設定エラーが発生する', () => {
  it('scheduledExecutionTimeがnullのとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null as any,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input as any)).rejects.toThrow(InvalidSchedulerConfigurationError);
    await expect(judgeSchedulerExecutionTiming(input as any)).rejects.toThrow('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });

  it('scheduledExecutionTimeが空文字列のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidSchedulerConfigurationError);
    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });
});
