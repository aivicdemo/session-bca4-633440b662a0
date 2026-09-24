import { judgeSchedulerExecutionTiming, isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn().mockReturnValue(true),
}));

describe('SCEN-753: 前日の日報提出期限までに提出した報告者が正しく分類され、リセット結果に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業日の定時スケジューラ実行時刻でスケジューラ判定がtrueを返し、前日期限までの提出者が対象外として分類される', () => {
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
