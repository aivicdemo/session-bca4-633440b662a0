import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

// テスト対象: SCEN-736
// スケジューラの必須設定が不正なとき、InvalidSchedulerConfigurationError が発生
// 注: 入力型に leaderEmail 等のフィールドが無いため、仕様とのギャップあり

describe('SCEN-736: スケジューラの必須設定が不正なときエラーが発生', () => {
  it('executionTimeToleranceMinutes が負数のとき、InvalidSchedulerConfigurationError をスロー', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: -1,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeSchedulerExecutionTiming(input)).toThrow(InvalidSchedulerConfigurationError);
  });

  it('scheduledExecutionTime が HH:mm 形式でないとき、InvalidSchedulerConfigurationError をスロー', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: 'invalid',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeSchedulerExecutionTiming(input)).toThrow(InvalidSchedulerConfigurationError);
  });
});
