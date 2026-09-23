import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

describe('SCEN-186: 営業日の指定時刻内に判定すると、実行可能と判定される', () => {
  it('営業日の指定時刻内はスケジューラ実行を判定する', () => {
    jest.spyOn(businessDayModule, 'isBusinessDay').mockReturnValue(true);

    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    };

    const result = judgeSchedulerExecutionTiming(input);

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
