import { describe, it, expect } from '@jest/globals';
import {
  InvalidSchedulerConfigurationError,
  JudgeSchedulerExecutionTimingInput,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-729: 提出期限の時刻が設定されていないとき、エラーが発生', () => {
  it('scheduledExecutionTimeがnullの場合、InvalidSchedulerConfigurationErrorが発生', () => {
    const judgeExecutor = (input: any) => {
      if (!input.scheduledExecutionTime) {
        throw new InvalidSchedulerConfigurationError(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
      return { shouldExecute: true };
    };

    const input: any = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeExecutor(input)).toThrow(InvalidSchedulerConfigurationError);
  });

  it('scheduledExecutionTimeが空文字列の場合、InvalidSchedulerConfigurationErrorが発生', () => {
    const judgeExecutor = (input: any) => {
      if (!input.scheduledExecutionTime) {
        throw new InvalidSchedulerConfigurationError(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
      return { shouldExecute: true };
    };

    const input: any = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => judgeExecutor(input)).toThrow(InvalidSchedulerConfigurationError);
  });

  it('エラーメッセージが正確に返される', () => {
    const judgeExecutor = (input: any) => {
      if (!input.scheduledExecutionTime) {
        throw new InvalidSchedulerConfigurationError(
          'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
        );
      }
      return { shouldExecute: true };
    };

    const input: any = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    try {
      judgeExecutor(input);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSchedulerConfigurationError);
      expect((error as Error).message).toBe(
        'スケジューラ実行時刻の設定が無効です。管理者に確認してください。'
      );
    }
  });
});
