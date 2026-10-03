import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-732: チームメンバーIDが空のとき、エラーが発生して処理が中断される', () => {
  it('should throw InvalidSchedulerConfigurationError when scheduledExecutionTime is empty', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeSchedulerExecutionTiming(input)).toThrow(InvalidSchedulerConfigurationError);
    try {
      judgeSchedulerExecutionTiming(input);
      fail('Should have thrown');
    } catch (e) {
      expect((e as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
    }
  });

  it('should throw InvalidSchedulerConfigurationError when scheduledExecutionTime is whitespace', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '   ',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeSchedulerExecutionTiming(input)).toThrow(InvalidSchedulerConfigurationError);
    try {
      judgeSchedulerExecutionTiming(input);
      fail('Should have thrown');
    } catch (e) {
      expect((e as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
    }
  });
});
