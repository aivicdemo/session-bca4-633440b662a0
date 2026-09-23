import { describe, it, expect, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-191: 実行予定時刻が未設定のとき、スケジューラ設定エラーが発生する', () => {
  it('should throw InvalidSchedulerConfigurationError when scheduledExecutionTime is null', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => {
      judgeSchedulerExecutionTiming(input);
    }).toThrow(InvalidSchedulerConfigurationError);

    let error;
    try {
      judgeSchedulerExecutionTiming(input);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
    expect(error?.message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });

  it('should throw InvalidSchedulerConfigurationError when scheduledExecutionTime is empty string', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => {
      judgeSchedulerExecutionTiming(input);
    }).toThrow(InvalidSchedulerConfigurationError);

    let error;
    try {
      judgeSchedulerExecutionTiming(input);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
    expect(error?.message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });
});
