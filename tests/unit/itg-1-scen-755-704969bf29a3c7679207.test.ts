import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn().mockReturnValue(true),
}));

describe('SCEN-755: 5名全員が前日に日報を提出した場合、未提出者リストが空になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の定時実行時刻で全員提出済みの場合に未提出者リストが空で確定されることを判定', () => {
    const result = judgeSchedulerExecutionTiming({
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
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
