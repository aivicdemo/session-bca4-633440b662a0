import { describe, it, expect, jest } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-190: 実行予定時刻が不正な形式のとき、スケジューラ設定エラーが発生する', () => {
  it('should throw InvalidSchedulerConfigurationError when scheduledExecutionTime is in invalid format', () => {
    // Stub isBusinessDay to return true
    jest.spyOn(require('../../src/logic/business-day-deadline-judgment'), 'isBusinessDay')
      .mockReturnValue(true);

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '25:99', // Invalid: hour is 25, minute is 99
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    // Call judgeSchedulerExecutionTiming and expect it to throw
    expect(() => {
      judgeSchedulerExecutionTiming(input);
    }).toThrow(InvalidSchedulerConfigurationError);

    // Verify error message
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
