import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-190: 実行予定時刻が不正な形式のとき、スケジューラ設定エラーが発生する', () => {
  it('時間が25、分が99という不正な形式の実行予定時刻でInvalidSchedulerConfigurationErrorが発生する', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '25:99',
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
