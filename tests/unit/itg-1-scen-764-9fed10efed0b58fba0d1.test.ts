import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  judgeSchedulerExecutionTiming,
  InvalidSchedulerConfigurationError,
} from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-764: 報告期限時刻が不正な形式のとき、処理が中断され「報告期限時刻は HH:mm 形式で設定してください」が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scheduledExecutionTime が「25:99」などHH:mm形式以外のとき、InvalidSchedulerConfigurationError が発生する', async () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '25:99',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(
      InvalidSchedulerConfigurationError
    );
  });

  it('scheduledExecutionTime が「17-30」のときもInvalidSchedulerConfigurationError が発生する', async () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17-30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(
      InvalidSchedulerConfigurationError
    );
  });

  it('scheduledExecutionTime が「1730」のときもInvalidSchedulerConfigurationError が発生する', async () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '1730',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(
      InvalidSchedulerConfigurationError
    );
  });

  it('scheduledExecutionTime が「17:30:00」のときもInvalidSchedulerConfigurationError が発生する', async () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(
      InvalidSchedulerConfigurationError
    );
  });
});
