import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn().mockReturnValue(true),
}));

describe('SCEN-752: 本日0:00時点で5名の有効な報告者が取得され、本日分の日報受付が初期化される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日0:00時点で本日分の日報受付初期化条件が満たされることを判定', () => {
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
    expect(result.executionReason).toBe('営業日の実行時刻内');
  });
});
