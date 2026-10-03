import { describe, it, expect } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
  JudgeSchedulerExecutionTimingInput
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-191: 実行予定時刻が未設定のとき、スケジューラ設定エラーが発生する', () => {
  it('should throw InvalidSchedulerConfigurationError when scheduledExecutionTime is null', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null as any,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    expect(() => {
      judgeSchedulerExecutionTiming(input as any);
    }).toThrow(InvalidSchedulerConfigurationError);
  });

  it('should throw with correct error message when scheduledExecutionTime is null', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null as any,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    expect(() => {
      judgeSchedulerExecutionTiming(input as any);
    }).toThrow('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });

  it('should throw InvalidSchedulerConfigurationError when scheduledExecutionTime is empty string', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    expect(() => {
      judgeSchedulerExecutionTiming(input);
    }).toThrow(InvalidSchedulerConfigurationError);
  });

  it('should throw with correct error message when scheduledExecutionTime is empty string', () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo'
    };

    expect(() => {
      judgeSchedulerExecutionTiming(input);
    }).toThrow('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });
});
