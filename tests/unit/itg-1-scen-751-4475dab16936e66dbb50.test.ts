import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn().mockReturnValue(true),
}));

describe('SCEN-751: 前日に提出された日報が過去データとしてアーカイブされ、未提出者リストが確定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の指定時刻（17:30）でスケジューラが実行可能であることを判定', () => {
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
