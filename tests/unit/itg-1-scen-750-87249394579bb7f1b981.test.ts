import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn().mockReturnValue(true),
}));

describe('SCEN-750: 毎日0:00に前日の日報提出期限が確定し、本日分の日報受付対象者が確定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の0:00時点でスケジューラが実行可能であることを判定', () => {
    const result = judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T00:00:00Z',
      scheduledExecutionTime: '00:00',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
    });

    expect(result.shouldExecute).toBe(true);
    expect(result.isBusinessDay).toBe(true);
    expect(result.isWithinExecutionWindow).toBe(true);
    expect(result.nextScheduledExecutionTime).toBeNull();
    expect(result.executionReason).toContain('営業日の実行時刻内');
  });
});
