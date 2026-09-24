import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-192: 実行可能なとき、次回実行予定時刻はnullで返される', () => {
  it('営業日の指定実行時刻内で実行時にnextScheduledExecutionTimeはnullで返される', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const mockIsBusinessDay = jest.fn().mockReturnValue(true);
    const dependencies = { isBusinessDay: mockIsBusinessDay };

    const output = judgeSchedulerExecutionTiming(input, dependencies);

    expect(output.shouldExecute).toBe(true);
    expect(output.isBusinessDay).toBe(true);
    expect(output.isWithinExecutionWindow).toBe(true);
    expect(output.nextScheduledExecutionTime).toBeNull();
    expect(output.executionReason).toBe('営業日の実行時刻内');
  });
});
