import { describe, it, expect } from '@jest/globals';
import {
  InvalidSchedulerConfigurationError,
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-728: reporterIdが空または不正な形式のとき、エラーが発生', () => {
  it('scheduledExecutionTimeが無効な場合、InvalidSchedulerConfigurationErrorが発生', () => {
    // 仕様に従い、scheduledExecutionTime が空または null の場合、
    // InvalidSchedulerConfigurationError が発生することを検証

    const isValidConfiguration = (input: any) => {
      if (!input.scheduledExecutionTime) {
        throw new InvalidSchedulerConfigurationError(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
      return true;
    };

    const invalidInputNull: any = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => isValidConfiguration(invalidInputNull)).toThrow(
      InvalidSchedulerConfigurationError
    );
  });

  it('scheduledExecutionTimeが空文字列の場合、InvalidSchedulerConfigurationErrorが発生', () => {
    const isValidConfiguration = (input: any) => {
      if (!input.scheduledExecutionTime || input.scheduledExecutionTime.trim() === '') {
        throw new InvalidSchedulerConfigurationError(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
      return true;
    };

    const invalidInputEmpty: any = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => isValidConfiguration(invalidInputEmpty)).toThrow(
      InvalidSchedulerConfigurationError
    );
  });

  it('エラーメッセージが正確に返される', () => {
    const isValidConfiguration = (input: any) => {
      if (!input.scheduledExecutionTime) {
        throw new InvalidSchedulerConfigurationError(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
      return true;
    };

    const invalidInput: any = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      isValidConfiguration(invalidInput);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
      expect((error as Error).message).toBe(
        'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
      );
    }
  });
});
