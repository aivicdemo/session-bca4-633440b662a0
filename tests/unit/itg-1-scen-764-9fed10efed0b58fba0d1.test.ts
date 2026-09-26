import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../.aivic/design/contract/src/logic/business-day-deadline-judgment';

describe('SCEN-764: 報告期限時刻が不正な形式のとき、処理が中断されエラーが発生する', () => {
  it('scheduledExecutionTimeが「25:99」形式の不正な値のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '25:99',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidSchedulerConfigurationError);
  });

  it('scheduledExecutionTimeが「17-30」形式（ハイフン区切り）の不正な値のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17-30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidSchedulerConfigurationError);
  });

  it('scheduledExecutionTimeが「1730」形式（コロン無し）の不正な値のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '1730',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidSchedulerConfigurationError);
  });

  it('scheduledExecutionTimeが「17:30:00」形式（HH:mm:ss）の不正な値のとき、InvalidSchedulerConfigurationErrorが発生する', async () => {
    const input: JudgeSchedulerExecutionTimingInput = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    await expect(judgeSchedulerExecutionTiming(input)).rejects.toThrow(InvalidSchedulerConfigurationError);
  });
});
