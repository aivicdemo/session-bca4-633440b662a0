import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-191: 実行予定時刻が未設定のとき、スケジューラ設定エラーが発生する', () => {
  it('scheduledExecutionTimeがnullのとき、InvalidSchedulerConfigurationErrorが発生する', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: null,
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const mockIsBusinessDay = jest.fn().mockReturnValue(true);
    const dependencies = { isBusinessDay: mockIsBusinessDay };

    let thrownError: Error | null = null;
    try {
      judgeSchedulerExecutionTiming(input, dependencies);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeInstanceOf(InvalidSchedulerConfigurationError);
    expect(thrownError?.message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });

  it('scheduledExecutionTimeが空文字列のとき、InvalidSchedulerConfigurationErrorが発生する', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const mockIsBusinessDay = jest.fn().mockReturnValue(true);
    const dependencies = { isBusinessDay: mockIsBusinessDay };

    let thrownError: Error | null = null;
    try {
      judgeSchedulerExecutionTiming(input, dependencies);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeInstanceOf(InvalidSchedulerConfigurationError);
    expect(thrownError?.message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  });
});
