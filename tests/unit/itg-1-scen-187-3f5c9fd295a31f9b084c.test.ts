import { judgeSchedulerExecutionTiming, isBusinessDay as isBusinessDayFn } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingOutput } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn(),
}));

describe('SCEN-187: 営業日だが指定時刻の許容範囲外のときは、実行不可と判定される', () => {
  beforeEach(() => {
    const { isBusinessDay } = require('../../src/logic/business-day-deadline-judgment');
    isBusinessDay.mockReturnValue(true);
  });

  it('営業日だが時刻が許容範囲より前のとき、実行不可と判定される', () => {
    const result: JudgeSchedulerExecutionTimingOutput = judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:25:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result.shouldExecute).toBe(false);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(false);
    expect(result.nextScheduledExecutionTime).toBe('2024-01-15T17:30:00Z');
    expect(result.executionReason).toBe('実行時刻外');
  });
});
